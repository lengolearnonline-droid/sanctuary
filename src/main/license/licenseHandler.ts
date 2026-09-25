// ============================================================
// Sanctuary — License Handler (Main Process)
// ============================================================

import { ipcMain } from 'electron';
import { machineIdSync } from 'node-machine-id';
import Store from 'electron-store';

// ─── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zitazlnrxpvfoonobcad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdGF6bG5yeHB2Zm9vbm9iY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMDk5NDAsImV4cCI6MjA4MTU4NTk0MH0.Lx5jPrTbyqhS4J5rYrrqCEnR--IHRYoeutV5CvA0Bws';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LicenseResult {
  valid: boolean;
  plan?: string;
  status?: 'active' | 'trial' | 'expired' | 'cancelled';
  daysLeft?: number;
  expiresAt?: string;
  maxActivations?: number;
  reason?: 'not_found' | 'expired' | 'machine_limit' | 'cancelled' | 'error';
  offline?: boolean;
}

interface StoredLicense {
  licenseKey: string;
  lastValidated: string;
  cachedResult: LicenseResult;
}

// ─── Encrypted local store ────────────────────────────────────────────────────
const store = new Store({
  name: 'sanctuary-license',
  encryptionKey: 'sanctuary-secure-store-v1',
});

// Helper wrappers for typed access
function storeGet<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}
function storeSet(key: string, value: unknown): void {
  store.set(key, value);
}
function storeDelete(key: string): void {
  store.delete(key);
}

// ─── Get stable machine ID ────────────────────────────────────────────────────
function getMachineId(): string {
  try {
    return machineIdSync(true); // hashed for privacy
  } catch {
    // Fallback: use a random ID stored locally
    const fallback = storeGet<StoredLicense>('license')?.licenseKey ?? `fallback-${Date.now()}`;
    return fallback.slice(0, 32);
  }
}

// ─── Call validate-license Edge Function ─────────────────────────────────────
async function callValidateLicense(licenseKey: string): Promise<LicenseResult> {
  const machineId = getMachineId();

  const res = await fetch(`${SUPABASE_URL}/functions/v1/validate-license`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ licenseKey, machineId }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[License] validate-license error:', text);
    return { valid: false, reason: 'error' };
  }

  return res.json() as Promise<LicenseResult>;
}

// ─── Call start-trial Edge Function ──────────────────────────────────────────
async function callStartTrial(email: string, fullName: string): Promise<{ licenseKey?: string; error?: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/sanctuary-start-trial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, fullName }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: text };
  }

  const data = await res.json() as any;
  return { licenseKey: data.licenseKey as string | undefined, error: data.error as string | undefined };
}

// ─── Register all IPC handlers ────────────────────────────────────────────────
export function registerLicenseHandlers(): void {

  // ── license:get-cached ───────────────────────────────────────────────────
  ipcMain.handle('license:get-cached', async (): Promise<StoredLicense | null> => {
    return storeGet<StoredLicense>('license') ?? null;
  });

  // ── license:validate ─────────────────────────────────────────────────────
  ipcMain.handle('license:validate', async (_event, licenseKey: string): Promise<LicenseResult> => {
    try {
      const result = await callValidateLicense(licenseKey);

      storeSet('license', {
        licenseKey,
        lastValidated: new Date().toISOString(),
        cachedResult: result,
      });

      return result;
    } catch (err) {
      console.warn('[License] Network error - checking cache');

      const stored = storeGet<StoredLicense>('license');
      if (stored && stored.licenseKey === licenseKey) {
        const daysSince = (Date.now() - new Date(stored.lastValidated).getTime()) / 86400000;

        if (daysSince < 7) {
          // Strictly calculate remaining days dynamically
          let finalDaysLeft = stored.cachedResult.daysLeft;
          if (stored.cachedResult.expiresAt) {
            const msLeft = new Date(stored.cachedResult.expiresAt).getTime() - Date.now();
            finalDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
            if (finalDaysLeft <= 0) {
              return { valid: false, reason: 'expired', offline: true };
            }
          }
          return { ...stored.cachedResult, daysLeft: finalDaysLeft, offline: true };
        } else {
          return { valid: false, reason: 'error', offline: true };
        }
      }

      return { valid: false, reason: 'error', offline: true };
    }
  });

  // ── license:start-trial ──────────────────────────────────────────────────
  ipcMain.handle('license:start-trial', async (_event, email: string, fullName: string): Promise<{ licenseKey?: string; error?: string }> => {
    try {
      const result = await callStartTrial(email, fullName);
      if (result.licenseKey) {
        const validation = await callValidateLicense(result.licenseKey);
        storeSet('license', {
          licenseKey: result.licenseKey,
          lastValidated: new Date().toISOString(),
          cachedResult: validation,
        });
      }
      return result;
    } catch (err: any) {
      return { error: err.message ?? 'Network error' };
    }
  });

  // ── license:clear ────────────────────────────────────────────────────────
  ipcMain.handle('license:clear', async (): Promise<void> => {
    storeDelete('license');
  });
}

