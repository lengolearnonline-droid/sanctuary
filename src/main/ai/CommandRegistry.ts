// ============================================================
// Sanctuary — Command Registry
// ============================================================

export enum CommandIntent {
  NEXT_SLIDE = 'NEXT_SLIDE',
  PREVIOUS_SLIDE = 'PREVIOUS_SLIDE',
  CLEAR_SCREEN = 'CLEAR_SCREEN',
  BLACKOUT = 'BLACKOUT',
  GO_LIVE = 'GO_LIVE',
  GO_PREVIEW = 'GO_PREVIEW',
  SHOW_SCRIPTURE = 'SHOW_SCRIPTURE',
  HIDE_SCRIPTURE = 'HIDE_SCRIPTURE',
  SHOW_LYRICS = 'SHOW_LYRICS',
  HIDE_LYRICS = 'HIDE_LYRICS',
  PAUSE_MEDIA = 'PAUSE_MEDIA',
  RESUME_MEDIA = 'RESUME_MEDIA',
  STOP_MEDIA = 'STOP_MEDIA',
  UNKNOWN = 'UNKNOWN',
}

export interface CommandDefinition {
  id: string;
  intent: CommandIntent;
  name: string;
  phrases: string[]; // Exact matches
  aliases: string[]; // Partial/word matches
  confidenceThreshold: number;
  requiresConfirmation: boolean;
  isDestructive: boolean;
  cooldownMs: number;
}

export const COMMAND_REGISTRY: Record<CommandIntent, CommandDefinition> = {
  [CommandIntent.NEXT_SLIDE]: {
    id: 'cmd_next_slide',
    intent: CommandIntent.NEXT_SLIDE,
    name: 'Next Slide',
    phrases: ['next slide', 'advance slide', 'move to next slide', 'go to next slide', 'go to the next slide', 'advance the presentation'],
    aliases: ['next', 'forward'],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.PREVIOUS_SLIDE]: {
    id: 'cmd_previous_slide',
    intent: CommandIntent.PREVIOUS_SLIDE,
    name: 'Previous Slide',
    phrases: ['previous slide', 'go back', 'go to previous slide'],
    aliases: ['previous', 'back'],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.CLEAR_SCREEN]: {
    id: 'cmd_clear_screen',
    intent: CommandIntent.CLEAR_SCREEN,
    name: 'Clear Screen',
    phrases: ['clear screen', 'clear the screen', 'please clear the screen', 'clear text'],
    aliases: ['clear'],
    confidenceThreshold: 0.90,
    requiresConfirmation: false, // In live environments, usually not confirmed, just fast.
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.BLACKOUT]: {
    id: 'cmd_blackout',
    intent: CommandIntent.BLACKOUT,
    name: 'Blackout',
    phrases: ['blackout', 'make the screen black', 'black out the screen'],
    aliases: ['black out'],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.GO_LIVE]: {
    id: 'cmd_go_live',
    intent: CommandIntent.GO_LIVE,
    name: 'Go Live',
    phrases: ['go live', 'send to program', 'show on screen'],
    aliases: [],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.GO_PREVIEW]: {
    id: 'cmd_go_preview',
    intent: CommandIntent.GO_PREVIEW,
    name: 'Go Preview',
    phrases: ['preview', 'send to preview'],
    aliases: [],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.SHOW_SCRIPTURE]: {
    id: 'cmd_show_scripture',
    intent: CommandIntent.SHOW_SCRIPTURE,
    name: 'Show Scripture',
    phrases: ['show scripture', 'display scripture'],
    aliases: ['show'], // Contextually paired with Phase 15 outputs
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.HIDE_SCRIPTURE]: {
    id: 'cmd_hide_scripture',
    intent: CommandIntent.HIDE_SCRIPTURE,
    name: 'Hide Scripture',
    phrases: ['hide scripture', 'remove scripture'],
    aliases: ['hide'],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.SHOW_LYRICS]: {
    id: 'cmd_show_lyrics',
    intent: CommandIntent.SHOW_LYRICS,
    name: 'Show Lyrics',
    phrases: ['show lyrics', 'display lyrics'],
    aliases: [],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.HIDE_LYRICS]: {
    id: 'cmd_hide_lyrics',
    intent: CommandIntent.HIDE_LYRICS,
    name: 'Hide Lyrics',
    phrases: ['hide lyrics', 'remove lyrics'],
    aliases: [],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.PAUSE_MEDIA]: {
    id: 'cmd_pause_media',
    intent: CommandIntent.PAUSE_MEDIA,
    name: 'Pause Media',
    phrases: ['pause media', 'pause video', 'pause audio', 'pause playback'],
    aliases: ['pause'],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.RESUME_MEDIA]: {
    id: 'cmd_resume_media',
    intent: CommandIntent.RESUME_MEDIA,
    name: 'Resume Media',
    phrases: ['resume media', 'resume video', 'resume audio', 'resume playback', 'play media', 'play video'],
    aliases: ['resume', 'play'],
    confidenceThreshold: 0.90,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 1000,
  },
  [CommandIntent.STOP_MEDIA]: {
    id: 'cmd_stop_media',
    intent: CommandIntent.STOP_MEDIA,
    name: 'Stop Media',
    phrases: ['stop media', 'stop video', 'stop audio', 'stop playback'],
    aliases: ['stop'],
    confidenceThreshold: 0.95,
    requiresConfirmation: true, // Stopping media abruptly is high impact
    isDestructive: true,
    cooldownMs: 2000,
  },
  [CommandIntent.UNKNOWN]: {
    id: 'cmd_unknown',
    intent: CommandIntent.UNKNOWN,
    name: 'Unknown',
    phrases: [],
    aliases: [],
    confidenceThreshold: 1.0,
    requiresConfirmation: false,
    isDestructive: false,
    cooldownMs: 0,
  }
};
