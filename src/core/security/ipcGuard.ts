import { ipcMain } from 'electron';
import { z } from 'zod';
import { Logger } from '../services/Logger';
import path from 'path';
import fs from 'fs';

const logger = new Logger('Security');

// ---- Custom Zod Types ----

/**
 * Validates that a string is a safe, absolute file path that actually exists.
 * Prevents basic path traversal exploits.
 */
export const SafeExistingFilePath = z.string().transform((val, ctx) => {
  const normalized = path.normalize(val);
  if (!path.isAbsolute(normalized)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Path must be absolute",
    });
    return z.NEVER;
  }
  if (!fs.existsSync(normalized)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "File does not exist",
    });
    return z.NEVER;
  }
  return normalized;
});

export const SafeDirPath = z.string().transform((val, ctx) => {
  const normalized = path.normalize(val);
  if (!path.isAbsolute(normalized)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Path must be absolute",
    });
    return z.NEVER;
  }
  // Optional: Check if directory exists, or allow creation
  if (fs.existsSync(normalized) && !fs.statSync(normalized).isDirectory()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Path exists but is not a directory",
    });
    return z.NEVER;
  }
  return normalized;
});

// JSON parsable string validation
export const JsonString = z.string().refine((val) => {
  try {
    JSON.parse(val);
    return true;
  } catch {
    return false;
  }
}, "Invalid JSON string");

type ZodTuple<T extends z.ZodTypeAny[]> = {
  [K in keyof T]: T[K] extends z.ZodTypeAny ? z.infer<T[K]> : never;
};

/**
 * Safely registers an IPC handle with Zod validation.
 */
export function safeHandle<T extends z.ZodTypeAny[], R>(
  channel: string,
  schema: z.ZodTuple<T>,
  handler: (...args: ZodTuple<T>) => Promise<R> | R
): void {
  ipcMain.handle(channel, async (event, ...args: any[]) => {
    try {
      const validatedArgs = schema.parse(args) as ZodTuple<T>;
      return await handler(...validatedArgs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`IPC Validation Error on channel '${channel}'`, { 
          issues: error.issues 
        });
        throw new Error(`Invalid arguments passed to ${channel}`);
      }
      throw error;
    }
  });
}
