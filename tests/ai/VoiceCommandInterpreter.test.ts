import { describe, it, expect, beforeEach } from 'vitest';
import { VoiceCommandInterpreter } from '../../src/main/ai/VoiceCommandInterpreter';
import { CommandIntent } from '../../src/main/ai/CommandRegistry';

describe('VoiceCommandInterpreter', () => {
  let interpreter: VoiceCommandInterpreter;

  beforeEach(() => {
    interpreter = new VoiceCommandInterpreter();
  });

  describe('TEST GROUP 1: Exact Commands', () => {
    it('should match exact registered phrases', () => {
      expect(interpreter.interpret('next slide').intent).toBe(CommandIntent.NEXT_SLIDE);
      expect(interpreter.interpret('previous slide').intent).toBe(CommandIntent.PREVIOUS_SLIDE);
      expect(interpreter.interpret('clear screen').intent).toBe(CommandIntent.CLEAR_SCREEN);
      expect(interpreter.interpret('blackout').intent).toBe(CommandIntent.BLACKOUT);
      expect(interpreter.interpret('pause media').intent).toBe(CommandIntent.PAUSE_MEDIA);
      expect(interpreter.interpret('resume media').intent).toBe(CommandIntent.RESUME_MEDIA);
    });
  });

  describe('TEST GROUP 2: Natural Variants', () => {
    it('should match natural variants via aliases or substrings', () => {
      expect(interpreter.interpret('please advance the presentation').intent).toBe(CommandIntent.NEXT_SLIDE);
      expect(interpreter.interpret('go back').intent).toBe(CommandIntent.PREVIOUS_SLIDE);
      expect(interpreter.interpret('make the screen black').intent).toBe(CommandIntent.BLACKOUT);
    });
    
    it('should match aliases if phrase is short enough', () => {
      expect(interpreter.interpret('please clear').intent).toBe(CommandIntent.CLEAR_SCREEN);
      expect(interpreter.interpret('next').intent).toBe(CommandIntent.NEXT_SLIDE);
    });
  });

  describe('TEST GROUP 3: Negation', () => {
    it('should not execute if negated', () => {
      expect(interpreter.interpret("don't blackout").intent).toBe(CommandIntent.UNKNOWN);
      expect(interpreter.interpret("do not clear the screen").intent).toBe(CommandIntent.UNKNOWN);
      expect(interpreter.interpret("never go to the next slide").intent).toBe(CommandIntent.UNKNOWN);
    });
  });

  describe('TEST GROUP 5 & 6: Scripture and Compound Commands', () => {
    it('should extract scripture if no command present (implicit SHOW)', () => {
      const res = interpreter.interpret('John 3 16');
      expect(res.intent).toBe(CommandIntent.SHOW_SCRIPTURE);
      expect(res.scriptureReference).toBeDefined();
      expect(res.scriptureReference?.book).toBe('john');
      expect(res.scriptureReference?.chapter).toBe(3);
      expect(res.scriptureReference?.verse).toBe(16);
    });

    it('should execute compound commands', () => {
      const res = interpreter.interpret('show Romans chapter 8 verse 28');
      expect(res.intent).toBe(CommandIntent.SHOW_SCRIPTURE);
      expect(res.scriptureReference).toBeDefined();
      expect(res.scriptureReference?.book).toBe('romans');
      expect(res.scriptureReference?.chapter).toBe(8);
      expect(res.scriptureReference?.verse).toBe(28);
    });
  });

  describe('TEST GROUP 8: Duplicate Commands', () => {
    it('should enforce cooldowns and exact duplicate suppression', () => {
      const intent = CommandIntent.NEXT_SLIDE;
      // First one works
      expect(interpreter.canExecute(intent, 'next slide')).toBe(true);
      // Immediate second fails (cooldown)
      expect(interpreter.canExecute(intent, 'next slide')).toBe(false);
      // Even if different phrase, fails cooldown
      expect(interpreter.canExecute(intent, 'advance slide')).toBe(false);
    });
  });

  describe('TEST GROUP 10: Malicious Input', () => {
    it('should block unsafe queries', () => {
      expect(interpreter.interpret('run command prompt').intent).toBe(CommandIntent.UNKNOWN);
      expect(interpreter.interpret('delete all files').intent).toBe(CommandIntent.UNKNOWN);
      expect(interpreter.interpret('drop database users').intent).toBe(CommandIntent.UNKNOWN);
      expect(interpreter.interpret('execute terminal').intent).toBe(CommandIntent.UNKNOWN);
    });
  });
});
