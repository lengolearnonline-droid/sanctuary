// ============================================================
// Sanctuary — Voice Command Interpreter
// ============================================================

import { CommandIntent, COMMAND_REGISTRY, CommandDefinition } from './CommandRegistry';
import { ScriptureExtractor, ExtractedReference } from './ScriptureExtractor';
import { Logger } from '../../core/services/Logger';

const logger = new Logger('VoiceCommandInterpreter');

export interface CommandResult {
  intent: CommandIntent;
  confidence: number;
  normalizedText: string;
  scriptureReference?: ExtractedReference;
}

export class VoiceCommandInterpreter {
  private lastExecutionTimes: Map<CommandIntent, number> = new Map();
  private lastExecutedTranscript: string = '';
  private lastScriptureReference: string = '';
  private lastScriptureTime: number = 0;

  /**
   * Normalizes transcript text safely without removing critical semantic meaning.
   */
  public normalize(transcript: string): string {
    return transcript
      .toLowerCase()
      .replace(/[.,!?]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')   // Collapse whitespace
      .trim();
  }

  /**
   * Checks if the transcript contains explicit negations.
   */
  public hasNegation(normalizedText: string): boolean {
    const negations = ["don't", "do not", "never", "stop", "cancel"];
    // Stop is tricky because of "stop media", but "don't blackout" is standard negation.
    const strictNegations = ["don't", "do not", "never", "cancel"];
    return strictNegations.some(neg => normalizedText.includes(neg));
  }

  /**
   * Primary interpretation pipeline.
   * Only called on FINAL transcripts.
   */
  public interpret(transcript: string): CommandResult {
    const normalized = this.normalize(transcript);

    // 1. Negation Check
    if (this.hasNegation(normalized)) {
      return {
        intent: CommandIntent.UNKNOWN,
        confidence: 1.0,
        normalizedText: normalized
      };
    }

    // 2. Security Check (Malicious Commands)
    if (this.isMalicious(normalized)) {
      logger.warn('Blocked potentially malicious command', { transcript: normalized });
      return {
        intent: CommandIntent.UNKNOWN,
        confidence: 1.0,
        normalizedText: normalized
      };
    }

    // 3. Scripture + Command Routing (Compound)
    const scriptureRefs = ScriptureExtractor.extract(normalized);
    let matchedScripture: ExtractedReference | undefined = scriptureRefs.length > 0 ? scriptureRefs[0] : undefined;

    // 4. Pattern Matching
    let bestMatch = this.matchCommand(normalized);

    // If we found a scripture, but no explicit command, it's implicitly a SHOW_SCRIPTURE intent
    if (matchedScripture && bestMatch.intent === CommandIntent.UNKNOWN) {
      bestMatch = {
        intent: CommandIntent.SHOW_SCRIPTURE,
        confidence: matchedScripture.confidence,
        normalizedText: normalized,
        scriptureReference: matchedScripture
      };
    } else if (matchedScripture && bestMatch.intent === CommandIntent.SHOW_SCRIPTURE) {
      // It's a compound command like "show John 3 16"
      bestMatch.scriptureReference = matchedScripture;
      bestMatch.confidence = Math.max(bestMatch.confidence, matchedScripture.confidence);
    }

    return bestMatch;
  }

  private matchCommand(normalized: string): CommandResult {
    let bestIntent = CommandIntent.UNKNOWN;
    let highestConfidence = 0;

    for (const key of Object.keys(COMMAND_REGISTRY) as CommandIntent[]) {
      const def = COMMAND_REGISTRY[key];

      // Exact Phrase Match (Level 1)
      if (def.phrases.includes(normalized)) {
        return {
          intent: def.intent,
          confidence: 1.0, // Perfect match
          normalizedText: normalized
        };
      }

      // Phrase Substring Match (Level 1.5)
      for (const phrase of def.phrases) {
        if (normalized.includes(phrase) && normalized.length <= phrase.length + 15) {
          const conf = 0.95;
          if (conf > highestConfidence) {
            highestConfidence = conf;
            bestIntent = def.intent;
          }
        }
      }

      // Alias / Substring Match (Level 2)
      // E.g., if text is "please go to next", and alias is "next"
      for (const alias of def.aliases) {
        if (normalized === alias || (normalized.includes(alias) && normalized.length <= alias.length + 15)) {
          // If the alias is present and the total string is relatively short (avoids matching "the next thing I said" as NEXT_SLIDE)
          const conf = 0.85; 
          if (conf > highestConfidence) {
            highestConfidence = conf;
            bestIntent = def.intent;
          }
        }
      }
    }

    return {
      intent: bestIntent,
      confidence: highestConfidence,
      normalizedText: normalized
    };
  }

  private isMalicious(normalized: string): boolean {
    const blockedPhrases = [
      'run command prompt', 'delete all files', 'execute terminal', 
      'drop database', 'format c', 'rm -rf', 'delete table', 'shell command'
    ];
    return blockedPhrases.some(b => normalized.includes(b));
  }

  /**
   * Evaluates deduplication and cooldowns.
   * Returns true if the command is allowed to execute.
   */
  public canExecute(intent: CommandIntent, normalizedText: string, scriptureReference?: any): boolean {
    if (intent === CommandIntent.UNKNOWN) return false;

    const def = COMMAND_REGISTRY[intent];
    const now = Date.now();
    const lastExecuted = this.lastExecutionTimes.get(intent) || 0;

    // Check cooldown
    if (now - lastExecuted < def.cooldownMs) {
      logger.debug(`Command ${intent} suppressed due to cooldown`);
      return false;
    }

    // Exact duplicate suppression within a longer window (e.g., 2000ms)
    // Helps if the ASR emits the same final transcript twice accidentally
    if (normalizedText === this.lastExecutedTranscript && (now - lastExecuted < 2000)) {
      logger.debug(`Command ${intent} suppressed as exact duplicate`);
      return false;
    }

    // If allowed, mark execution
    this.lastExecutionTimes.set(intent, now);
    this.lastExecutedTranscript = normalizedText;
    return true;
  }
}
