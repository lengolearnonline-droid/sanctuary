// ============================================================
// Sanctuary — Type Declaration for Window API
// ============================================================

import type { SanctuaryAPI } from '../../main/preload';

declare global {
  interface Window {
    sanctuary: SanctuaryAPI;
  }
}

export {};
