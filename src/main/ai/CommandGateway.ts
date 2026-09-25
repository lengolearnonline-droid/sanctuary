// ============================================================
// Sanctuary — Command Gateway & Safety Gate
// ============================================================

import { CommandIntent, COMMAND_REGISTRY } from './CommandRegistry';
import { VoiceCommandInterpreter, CommandResult } from './VoiceCommandInterpreter';
import { Logger } from '../../core/services/Logger';
import { BrowserWindow } from 'electron';

const logger = new Logger('CommandGateway');

export class CommandGateway {
  private interpreter: VoiceCommandInterpreter;

  // Thresholds (could be loaded from DB settings later)
  private config = {
    highConfidenceThreshold: 0.90,
    mediumConfidenceThreshold: 0.75,
    allowMediumConfidence: false, // E.g., require confirmation or contextual validation
  };

  constructor() {
    this.interpreter = new VoiceCommandInterpreter();
  }

  /**
   * Main entry point for transcripts.
   * Enforces that partial transcripts DO NOT execute commands.
   */
  public handleTranscript(transcript: string, isFinal: boolean, programWindow: BrowserWindow | null, stageWindow: BrowserWindow | null, mainWindow: BrowserWindow | null): void {
    const result = this.interpreter.interpret(transcript);
    
    if (!isFinal) {
      // For true real-time streaming, we allow high-confidence SCRIPTURE to fire immediately without waiting for a pause!
      if (result.intent !== CommandIntent.SHOW_SCRIPTURE || result.confidence < 0.9) {
         return; 
      }
    }

    if (result.intent !== CommandIntent.UNKNOWN) {
      this.safetyGate(result, programWindow, stageWindow, mainWindow);
    }
  }

  /**
   * Evaluates safety rules, deduplication, and confidence before execution.
   */
  private safetyGate(result: CommandResult, programWindow: BrowserWindow | null, stageWindow: BrowserWindow | null, mainWindow: BrowserWindow | null): void {
    const def = COMMAND_REGISTRY[result.intent];

    // 1. Confidence Policy
    if (result.confidence < this.config.mediumConfidenceThreshold) {
      logger.debug(`Command rejected (Low Confidence: ${result.confidence})`, result as any);
      return;
    }

    // 2. Duplicate / Cooldown State
    if (!this.interpreter.canExecute(result.intent, result.normalizedText, result.scriptureReference)) {
      // Suppressed
      return;
    }

    if (result.confidence < this.config.highConfidenceThreshold && !this.config.allowMediumConfidence) {
      logger.info(`Command routed to suggestion queue (Medium Confidence: ${result.confidence})`, result as any);
      mainWindow?.webContents.send('ai:suggestion', {
        id: `sug_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: 'command',
        title: def.name,
        confidence: result.confidence,
        data: result,
      });
      return;
    }

    // 3. Confirmation Requirements (Safety-Critical Commands)
    if (def.requiresConfirmation) {
      logger.info(`Command requires confirmation, routing to suggestion queue: ${result.intent}`);
      mainWindow?.webContents.send('ai:suggestion', {
        id: `sug_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: 'confirmation',
        title: `Confirm ${def.name}?`,
        confidence: result.confidence,
        data: result,
      });
      return;
    }

    // Pass the safety gate -> Execute
    logger.info(`Executing Command: ${result.intent} (Confidence: ${result.confidence})`);
    this.executeCommand(result, programWindow, stageWindow, mainWindow);
  }

  /**
   * Unified command execution.
   * Maps abstract Intents to concrete Application Services/IPC channels.
   */
  public executeCommand(result: CommandResult, programWindow: BrowserWindow | null, stageWindow: BrowserWindow | null, mainWindow: BrowserWindow | null): void {
    
    // Broadcast diagnostic execution to dashboard UI
    if (mainWindow) {
      mainWindow.webContents.send('ai:command:executed', {
        intent: result.intent,
        confidence: result.confidence,
        normalized: result.normalizedText,
        timestamp: Date.now()
      });
    }

    switch (result.intent) {
      case CommandIntent.CLEAR_SCREEN:
        programWindow?.webContents.send('presentation:clear');
        stageWindow?.webContents.send('presentation:clear');
        break;
      
      case CommandIntent.BLACKOUT:
        programWindow?.webContents.send('presentation:blackout', true);
        stageWindow?.webContents.send('presentation:blackout', true);
        break;

      case CommandIntent.SHOW_SCRIPTURE:
        // When user approves or command has high confidence, we send a live action
        if (result.scriptureReference && mainWindow) {
          mainWindow.webContents.send('ai:action', 'GO_LIVE_SCRIPTURE', result.scriptureReference);
        }
        break;

      case CommandIntent.NEXT_SLIDE:
        // Usually, presentation state is driven by the React renderer (mainWindow) sending setSlide.
        // So we send an action to the dashboard window to advance its internal state.
        mainWindow?.webContents.send('ai:action', 'NEXT_SLIDE');
        break;

      case CommandIntent.PREVIOUS_SLIDE:
        mainWindow?.webContents.send('ai:action', 'PREVIOUS_SLIDE');
        break;

      case CommandIntent.PAUSE_MEDIA:
      case CommandIntent.RESUME_MEDIA:
      case CommandIntent.STOP_MEDIA:
        // We broadcast to the mainWindow where the AudioEngine/MediaStore lives
        mainWindow?.webContents.send('ai:action', result.intent);
        break;

      default:
        logger.warn(`Execution handler missing for intent: ${result.intent}`);
        break;
    }
  }
}
