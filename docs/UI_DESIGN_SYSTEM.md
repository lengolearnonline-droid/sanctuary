# UI Design System & Component Guidelines
# Sanctuary — AI-Powered Church Presentation & Broadcast System

**Document Version:** 1.0.0  
**Status:** Approved Design Specification  
**Design Philosophy:** Dark-First, High Contrast, Low Eye-Strain, Ergonomic Live Operations  
**Primary Target Resolution:** 1920x1080 (1080p) to 3840x2160 (4K UHD)  

---

## 1. Design Philosophy & Visual Ergonomics

Church media booths are typically dimly lit environments where volunteers operate under high pressure. The Sanctuary UI Design System is engineered to:
1. **Eliminate Fatigue:** Pure dark-mode baseline with carefully calibrated contrast ratios to prevent screen glare.
2. **Prevent Operator Catastrophe:** Unambiguous, unmistakable visual differentiation between **PREVIEW (Amber)** and **PROGRAM / LIVE (Red)** states.
3. **Optimize for Speed:** 100% keyboard accessibility, high-density information architecture, and large tactile click targets.

---

## 2. Color System & Design Tokens

### 2.1 Dark Surface Palette (Backgrounds & Containers)
```css
--surface-950: #090A0F; /* Root Canvas / Background */
--surface-900: #12141C; /* Main Container / Panel Background */
--surface-800: #1A1D28; /* Elevated Cards / Active Sections */
--surface-700: #242838; /* Hover States / Inset Controls */
--surface-600: #31374C; /* Inactive Borders & Dividers */
--border-subtle:#2D3348; /* Subtle Separation Borders */
--border-strong:#454E6B; /* Active Focus Rings & Borders */
```

### 2.2 Brand & Functional Accents
```css
--brand-primary:   #6366F1; /* Indigo Accent */
--brand-secondary: #06B6D4; /* Cyan Highlight */
--brand-violet:    #8B5CF6; /* AI Assistant Glow */
```

### 2.3 Live Production & Status Signals
```css
/* LIVE / PROGRAM (Active output to congregation & stream) */
--live-red:        #EF4444; /* Vivid Red 500 */
--live-red-glow:   rgba(239, 68, 68, 0.45); /* Pulse effect */
--live-red-bg:     #450A0A; /* Dark Red Container Fill */

/* PREVIEW (Staged content ready to take live) */
--preview-amber:   #F59E0B; /* Amber 500 */
--preview-amber-bg:#451A03; /* Dark Amber Container Fill */

/* CONFIDENCE & SUCCESS */
--status-success:  #10B981; /* Emerald 500 */
--status-info:     #3B82F6; /* Blue 500 */
--status-warning:  #F59E0B; /* Amber 500 */
--status-error:    #F43F5E; /* Rose 500 */
```

### 2.4 Text & Typography Hierarchy
```css
--text-primary:   #F8FAFC; /* Slate 50 - Titles & Body Text (WCAG AAA) */
--text-secondary: #94A3B8; /* Slate 400 - Subtitles & Metadata */
--text-muted:     #64748B; /* Slate 500 - Timestamps & Inactive Labels */
--text-disabled:  #475569; /* Slate 600 - Disabled Buttons */
```

---

## 3. Typography Scale & Font Families

### 3.1 Font Stacks
- **UI & Controls Font:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`
- **Monospace (Clocks, Timers, VU Meters):** `JetBrains Mono`, `Consolas`, `monospace`
- **Scripture & Lyric Projection Engine:** `Source Sans Pro`, `Merriweather`, `Georgia`, `serif`

### 3.2 Type Scale

| Token | Size | Line Height | Weight | Application |
| :--- | :--- | :--- | :--- | :--- |
| `text-display` | 32px | 38px | 700 Bold | Fullscreen Clocks, Big Timers |
| `text-h1` | 20px | 26px | 600 SemiBold | Modal Headers, Section Titles |
| `text-h2` | 16px | 22px | 600 SemiBold | Panel Headers, Song Titles |
| `text-h3` | 14px | 20px | 600 SemiBold | Card Labels, Section Badges |
| `text-body` | 13px | 18px | 400 Regular | Primary UI Labels, Lyric Preview |
| `text-small` | 11px | 15px | 500 Medium | Metadata, Key Signatures, CCLI # |
| `text-micro` | 10px | 13px | 700 Bold | Uppercase Badges, Hotkey Tags |

---

## 4. Spacing, Grid & Elevation

### 4.1 4px Spacing Grid
`space-1` (4px), `space-2` (8px), `space-3` (12px), `space-4` (16px), `space-6` (24px), `space-8` (32px), `space-12` (48px).

### 4.2 Elevation Layers & Depth
- **Layer 0 (Canvas):** `background: var(--surface-950);`
- **Layer 1 (Panels):** `background: var(--surface-900); border: 1px solid var(--border-subtle);`
- **Layer 2 (Cards / Modals):** `background: var(--surface-800); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);`
- **Layer 3 (Toasts & Overlays):** `background: var(--surface-800); box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.8);`

---

## 5. Master Layout Architecture

The operator screen is divided into 4 primary spatial zones:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: Service Title | AI Speech Indicator & VU Meter | Settings | Window Controls  │
├───────────────┬──────────────────────────────────────────┬─────────────────────────────┤
│ SERVICE ORDER │ CENTER WORKSPACE                         │ DUAL MONITOR SURFACE        │
│ & RUN LIST    │                                          │                             │
│ (280px)       │ ┌──────────────────────────────────────┐ │ ┌─────────────────────────┐ │
│               │ │ QUICK SEARCH (Bible / Lyrics / Media)│ │ │ PREVIEW MONITOR (Amber) │ │
│ 1. Welcome    │ └──────────────────────────────────────┘ │ └─────────────────────────┘ │
│ 2. Song: Way  │ ┌──────────────────────────────────────┐ │ ┌─────────────────────────┐ │
│    Maker      │ │ SLIDE GRID / VERSE PICKER / MEDIA    │ │ │ PROGRAM LIVE (Red Glow) │ │
│ 3. Scripture: │ │                                      │ │ └─────────────────────────┘ │
│    Rom 8:28   │ │ [ V1 ] [ C1 ] [ V2 ] [ C2 ] [ B1 ]   │ ├─────────────────────────────┤
│ 4. Sermon     │ │                                      │ │ TRANSITION CONTROLS       │
│ 5. Benediction│ └──────────────────────────────────────┘ │ │ [CUT] [FADE] [CLEAR TEXT] │
│               │                                          │ │ [BLACKOUT] [AUTO-LIVE:ON] │
└───────────────┴──────────────────────────────────────────┴─────────────────────────────┘
```

---

## 6. Core Component Specifications

### 6.1 Program vs Preview Distinction (Critical Rule)
- **PROGRAM / LIVE Monitor Card:**
  - Border: `3px solid var(--live-red)` with glowing outer pulse animation.
  - Header: Vivid Red badge `● LIVE ON AIR`.
  - Background overlay: Subtle deep-red vignette.
- **PREVIEW Monitor Card:**
  - Border: `2px solid var(--preview-amber)`.
  - Header: Amber badge `○ PREVIEW (NEXT)`.

### 6.2 Slide Card Component (`SlideCard.tsx`)
- **Dimensions:** 16:9 aspect ratio thumbnail with high-contrast text overlay.
- **States:**
  - `Idle`: Border `1px solid var(--border-subtle)`.
  - `Hover`: Border `1px solid var(--border-strong)`, slight scale (1.02).
  - `Selected (Preview)`: Border `2px solid var(--preview-amber)`.
  - `Live (Active)`: Border `3px solid var(--live-red)`, active badge `LIVE` in top right.
- **Hotkeys:** Numeric badge in bottom-left corner (e.g., `[1]`, `[2]`, `[C]`).

### 6.3 Audio VU Level Meter (`AudioLevelMeter.tsx`)
- **Display:** Horizontal or vertical segmented LED bar.
- **Color Bands:**
  - `-∞ to -12 dB`: Safe Green (`#10B981`)
  - `-12 dB to -3 dB`: Caution Yellow (`#F59E0B`)
  - `-3 dB to 0 dB+`: Peak Clipping Red (`#EF4444`)

### 6.4 AI Scripture Suggestion Toast (`AISuggestionToast.tsx`)
- **Position:** Bottom-center or floating over slide grid.
- **Visuals:** Pulsing violet/cyan border, speech waveform icon, detected verse tag (`Romans 8:28 - 94% match`), snippet preview.
- **Action Buttons:**
  - `[Enter] Project Live` (Vivid Amber/Red button).
  - `[Tab] Stage to Preview` (Secondary Slate button).
  - `[Esc] Dismiss` (Ghost button).

### 6.5 Button Variants (`Button.tsx`)
1. **Primary Action:** Solid Indigo (`#6366F1`), white text, hover glow.
2. **Live Action:** Solid Vivid Red (`#EF4444`), white bold text, pulsing box-shadow.
3. **Preview Action:** Solid Amber (`#F59E0B`), dark text.
4. **Secondary / Neutral:** Surface 700 (`#242838`), slate 200 text, border subtle.
5. **Ghost / Icon:** Transparent background, slate 400 icon, hover background `#242838`.

---

## 7. Accessibility & Volunteer Ergonomics

1. **Touch & Click Target Area:** All interactive buttons, slide tiles, and menu toggles maintain a minimum interactive hit target of `38px x 38px`.
2. **Keyboard-Only Operation:**
   - `Spacebar` / `Right Arrow`: Next Slide
   - `Left Arrow`: Previous Slide
   - `F5`: Take Preview to Live
   - `Esc`: Clear All / Emergency Text Clear
   - `F1`: Quick Scripture Search
   - `F2`: Quick Song Search
   - `F8`: Toggle AI Auto-Live Detection
3. **High-Contrast Typography:** All essential text elements maintain a minimum WCAG AAA contrast ratio (≥ 7:1) against their container backgrounds.
