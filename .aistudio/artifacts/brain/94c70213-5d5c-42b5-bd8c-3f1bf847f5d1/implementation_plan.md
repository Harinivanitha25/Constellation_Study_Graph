# Clickable Correction Badges for Misspelled Words

Replace silent background text alterations with non-intrusive, clickable suggestion badges that appear above verified misspelled words and typos, ensuring valid words and sentences are never altered automatically.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed and will govern the new spelling assistant:
> - **Zero Automatic Overwriting**: Stop all automatic silent text rewriting. The editor will never rewrite words or sentences in the background without explicit user consent.
> - **Clickable Correction Badges**: When a verified misspelling or typo is typed (e.g., `teh`, `experament`, `seperate`, `definately`), a clean, unobtrusive floating suggestion badge appears directly above the word showing the best candidate (e.g. `"the"`, `"experiment"`, `"separate"`).
> - **One-Click Replacement**: Clicking the badge instantly replaces the misspelled word and dismisses the badge.
> - **High-Confidence Typos Only**: Detection is restricted strictly to high-confidence spelling mistakes and known typo patterns, ensuring correct words and sentences remain 100% untouched.

---

### 1. Overview & Core Concept

- **What It Does**: Shifts from a disruptive background auto-replacer to a modern, user-empowered spelling assistant. As you draft notes, the browser's native spellchecker provides red wavy underlines for misspellings, and Constellation offers a discreet, clickable suggestion pill floating above the active typo.
- **Target Audience**: Students, researchers, and note-takers who want clean notes without their valid technical vocabulary or phrasing being accidentally altered.
- **Key Value**: Peace of mind and full control. No more fighting against an over-eager auto-corrector that changes correct words into unwanted replacements.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Typing Flow*: The user writes notes freely. Correct words and standard sentences are left untouched.
  2. *Misspelling Detection Flow*: When the user finishes typing a verified misspelled word or pauses for 1-2 seconds, a lightweight floating badge appears above the word with a subtle cyan/sky glow (e.g. `Did you mean: the?`).
  3. *One-Click Fix Flow*: Clicking the badge (or pressing a quick shortcut) instantly swaps the typo for the corrected word and vanishes cleanly.
  4. *Ignoring Flow*: If the user continues typing past it or clicks elsewhere, the badge quietly fades away without modifying any text.

- **Visual Styling**:
  - *Badge Aesthetic*: Pill-shaped floating popover (`bg-slate-900/95 border border-sky-500/50 text-sky-300 shadow-xl backdrop-blur-md px-2 py-1 text-xs rounded-lg font-medium cursor-pointer hover:bg-sky-500/20 hover:text-white transition flex items-center gap-1.5`).
  - *Positioning*: Positioned directly above the misspelled word using ProseMirror's `coordsAtPos` coordinates.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Clickable Badge vs Silent Auto-Replacement**
  - *Chosen Approach*: Display a clickable badge above the word rather than automatically mutating the document in the background.
  - *Why*: Automatic background replacement can never guess 100% of human intent and creates severe frustration when it rewrites correct words or names. A one-click badge gives the user full control with zero friction.
  - *Alternatives Considered*: Native right-click menu only, but browser context menus require right-clicking and can be slow or blocked.

- **Decision 2: High-Confidence Typo Filtering**
  - *Chosen Approach*: Only offer suggestions for high-confidence common typos and verified misspellings. Any word recognized in the dictionary or inflected grammar (-s, -ed, -ing, -ly) will never trigger a suggestion.
  - *Why*: Eliminates visual clutter and ensures badges only appear when genuinely helpful.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   NotepadEditor                        │
│    - Listens to typing pauses (1-2s debounce)          │
│    - Detects active misspelled words in current line   │
│    - Computes DOM coordinates via view.coordsAtPos     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              CorrectionBadge (Overlay HUD)             │
│    - Floating pill above the active misspelled word    │
│    - Shows: "Did you mean: [Corrected Word]?"          │
│    - Click -> Executes atomic replacement in document  │
│    - Esc / Continue typing -> Dismisses badge          │
└────────────────────────────────────────────────────────┘
```

#### Key Implementation Steps:
1. **Disable Silent Auto-Replacement**: Remove the automatic background document transaction in `NotepadEditor.tsx` so correct words and sentences are never altered behind the scenes.
2. **Implement Suggestion Detection**:
   - Detect active typo in the current editing context using `getAutoCorrection(rawWord)`.
   - Calculate screen coordinates using `view.coordsAtPos(from)`.
3. **Build Clickable Suggestion Badge**:
   - Render a floating badge above the misspelled word showing the candidate.
   - On click, execute a clean ProseMirror replacement transaction and dismiss.
4. **Verification**:
   - Verify typing valid sentences never changes any text.
   - Verify typing a typo (e.g. `teh`, `seperate`, `experament`) displays the clickable badge.
   - Verify clicking the badge applies the correct word cleanly.
