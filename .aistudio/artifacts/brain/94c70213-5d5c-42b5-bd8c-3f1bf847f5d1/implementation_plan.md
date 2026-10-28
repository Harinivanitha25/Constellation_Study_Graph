# Automatic Typo Correction Engine & Spellcheck UI Removal

This plan outlines the removal of the previous manual spellcheck toolbar button and ignore popover from `NotepadEditor.tsx`, replacing them with an automatic, in-browser typo correction engine that detects and auto-fixes misspelled words 3 seconds after typing stops, accompanied by a subtle visual pulse.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user during Phase 1:
> - **Spellcheck UI Removal**: Completely remove the Spellcheck button, settings popover, and ignore list form from the editor toolbar.
> - **Auto-Correct Timing**: 3 seconds of idle time after typing stops before auto-correcting misspelled words.
> - **Correction Mechanism**: Built-in algorithmic dictionary matching with edit distance similarity (Levenshtein / Damerau-Levenshtein).
> - **Visual Feedback**: A brief, gentle highlight pulse on the corrected word so the user is aware of what changed without disrupting typing flow.

---

### 1. Overview & Core Concept

1. **Clean Toolbar**:
   - Strips away the manual "Spellcheck" button, popover modal, ignore list, and tag cloud from `NotepadEditor.tsx`. The toolbar returns to a clean, focused set of formatting and insert controls.

2. **Algorithmic Auto-Correction (`autoCorrectService.ts`)**:
   - Implements a fast, zero-dependency client-side spelling correction utility featuring:
     - An integrated offline vocabulary set covering everyday English and common study/academic terms.
     - Damerau-Levenshtein distance calculation (evaluating insertions, deletions, substitutions, and adjacent transpositions like `teh` -> `the`, `becuase` -> `because`, `definately` -> `definitely`).
     - Case preservation (e.g., capitalizing the correction if the original word was capitalized).
     - Punctuation preservation (e.g., keeping commas, periods, or quotation marks intact).

3. **Debounced 3-Second Inline Replacement**:
   - When the user pauses typing for 3 seconds, the editor evaluates recently modified words.
   - If a word is misspelled and has an unambiguous high-confidence match in the dictionary, it is automatically replaced in the Tiptap document.
   - An undo history step is preserved so the user can easily press `Ctrl+Z` if they meant to keep an unusual word or proper noun.
   - The corrected word receives a brief, elegant cyan glow animation that smoothly fades out after 1.5 seconds.

---

### 2. User Experience & Visual Design

#### A. Typing Workflow
- The user writes freely without popup interruptions or manual dictionary management.
- 3 seconds after typing ceases, any mistyped word is automatically replaced with its correct spelling.
- Example: typing `I am studyng quantm mechanics` smoothly becomes `I am studying quantum mechanics`.

#### B. Visual Pulse Animation
- The corrected word receives a temporary CSS glow:
  - Background: `rgba(56, 189, 248, 0.2)` (subtle cyan aura).
  - Transition: smooth ease-out fade to transparent over 1.5 seconds.
  - Non-intrusive: does not shift layout or steal focus.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Algorithmic Levenshtein Matcher vs. Heavy ML Model**:
  - *Chosen*: Pure algorithmic Levenshtein matching on a curated dictionary.
  - *Why*: Instantaneous execution (< 2ms) with zero memory overhead, running purely on CPU without blocking the UI thread or downloading additional model weights.
- **Decision 2: 3-Second Typing Debounce**:
  - *Chosen*: 3000ms idle delay.
  - *Why*: Prevents prematurely modifying words while the user is still in the middle of spelling them out or typing compound words.
- **Decision 3: Case & Punctuation Preservation**:
  - *Chosen*: Automatically preserve leading capitals and trailing punctuation.
  - *Why*: Ensures sentences remain grammatically intact after replacement.

---

### 4. Technical Architecture & Component Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUTO-CORRECTION PIPELINE                           │
│                                                                             │
│   User Types in NotepadEditor.tsx                                           │
│                 │                                                           │
│                 ▼                                                           │
│   Debounce Timer (3000ms idle threshold)                                    │
│                 │ (fires after 3s of inactivity)                            │
│                 ▼                                                           │
│   autoCorrectService.ts                                                     │
│   ├── Tokenize words around cursor                                          │
│   ├── Check against dictionary                                              │
│   └── Compute Damerau-Levenshtein similarity (distance <= 2)               │
│                 │                                                           │
│                 ▼                                                           │
│   Match Found? ───► YES ───► Tiptap Transaction:                            │
│                              • Replace misspelled range with corrected word │
│                              • Apply brief cyan pulse highlight mark/decor  │
│                              • Native ProseMirror History (Ctrl+Z to undo)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Planned File Modifications:
1. **`src/services/autoCorrectService.ts` (New)**:
   - Core dictionary data structure.
   - Damerau-Levenshtein distance algorithm.
   - `findCorrection(word: string): string | null` function with casing and punctuation preservation.
2. **`src/components/editor/NotepadEditor.tsx`**:
   - Remove Spellcheck button, settings popover, ignore list form, and associated state.
   - Wire 3-second debounced auto-correct effect into Tiptap editor changes.
3. **`src/index.css`**:
   - Add `@keyframes autocorrect-pulse` for the gentle highlight animation.

---

### 5. Verification Plan
- **Toolbar Verification**: Confirm the Spellcheck button and popover are completely gone from the toolbar.
- **Auto-Correction Verification**: Type common typos (e.g. `computr`, `algoritm`, `thier`, `studing`) and wait 3 seconds; verify words are corrected automatically.
- **Pulse Highlight Verification**: Confirm the corrected word briefly glows cyan and fades out cleanly.
- **Undo Verification**: Press `Ctrl+Z` to confirm the correction can be immediately reverted.
- **Build Verification**: Run `compile_applet` and `lint_applet` to ensure zero compilation or TypeScript errors.
