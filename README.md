# Constellation — Personal Study Knowledge Graph

A local-first, privacy-respecting personal knowledge graph and study notepad. **Constellation** visualizes your notes and ideas as an interactive star map, uncovering hidden connections between concepts using in-browser neural embeddings and semantic vector similarity.

---

##  Key Features

###  Interactive Star-Map Knowledge Graph
- **Cosmic Graph Canvas:** Visualizes each topic as a star node in a deep-space canvas built on `@xyflow/react`.
- **Intelligent Semantic Auto-Linking:** Automatically discovers connections between topics based on mathematical cosine similarity of their content.
- **Manual Connections:** Drag between node ports to manually link topics; select any link and press `Backspace` or `Delete` to hide or remove it.
- **Node Preview Cards:** Hover or tap on any node to view a glassmorphism summary card, preview image, and instant edit button.
- **Persistent Viewport:** Your zoom level and canvas coordinates are tracked and preserved; returning from a note restores the exact camera angle.

###  In-Browser Neural AI & Vector Embeddings
- **Client-Side Transformers:** Runs the `Xenova/all-MiniLM-L6-v2` transformer model directly inside the browser using WebAssembly and ONNX via `@xenova/transformers`.
- **Zero Server Telemetry / 100% Private:** Embeddings are generated on your local machine; your private thoughts and study notes never touch third-party servers.
- **Offline Model Caching:** Model weights are cached in browser `CacheStorage` for immediate offline access after the initial download.
- **Graceful Fallback:** If the neural model is still initializing or WebAssembly is restricted, an intelligent keyword-overlap TF-IDF algorithm seamlessly steps in.
- **Similarity Threshold Control:** Adjust the slider or toggle auto-links on and off at any time.

###  Rich Text Notepad & Study Workspace
- **Tiptap v3 Rich Text Engine:** Distraction-free notepad featuring Headings (H1–H3), Bold, Italic, Underline (`Ctrl+U`), Strikethrough, Inline Code, Blockquotes, Bulleted & Numbered Lists, Dividers, and Undo/Redo.
- **Interactive Resizable Images:**
  - Corner drag handles to scale images smoothly to any custom width (20% to 100%).
  - One-click presets: `25%`, `50%`, `75%`, `100%`.
  - Alignment controls: Left, Center, Right.
  - Drag-and-drop and clipboard paste (`Ctrl+V`) image insertion.
  - Image self-healing pipeline that preserves and restores images across page reloads.
- **Live Metrics:** Real-time word counter and estimated reading time.
- **Autosave & Breadcrumbs:** Changes are debounced and saved automatically to local storage with visual status indicators.

###  Local-First, Offline & PWA
- **Dexie.js / IndexedDB:** All data—topics, notes, embeddings, images, and relationships—are stored in browser storage.
- **Installable PWA:** Works offline as a desktop or mobile Progressive Web App with service workers and an install prompt.
- **Complete Data Portability:** Export your entire constellation (including embedded images and manual links) to a portable JSON backup file and restore anytime.

---

##  Architecture & System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER INTERFACE LAYER                            │
│                                                                             │
│   ┌───────────────────────────────┐     ┌───────────────────────────────┐   │
│   │   Graph View (/ route)        │     │  Topic Notes View (/topic/:id)│   │
│   │   • React Flow Starfield      │     │  • Centered 75% Layout        │   │
│   │   • Constellation Nodes/Edges │     │  • Tiptap Rich Text Editor    │   │
│   │   • Viewport Persistence      │     │  • Resizable Image NodeView   │   │
│   │   • Search & Star Counter     │     │  • Connected Topics Bar       │   │
│   └───────────────┬───────────────┘     └───────────────┬───────────────┘   │
└───────────────────┼─────────────────────────────────────┼───────────────────┘
                    │                                     │
┌───────────────────▼─────────────────────────────────────▼───────────────────┐
│                          APPLICATION STATE LAYER                            │
│                                                                             │
│                 Zustand Global Store (useConstellationStore)                │
│         • topics[]             • storedLinks[]       • similarityThreshold  │
│         • showAutoLinks        • searchQuery         • savedViewport        │
│         • modelStatus          • CRUD Actions        • Link Actions         │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
┌───────────────────▼──────────────────┐   ┌──────────────▼───────────────────┐
│     SEMANTIC & LINKING ENGINE        │   │       STORAGE & REPOSITORY       │
│                                      │   │                                  │
│ • Xenova/all-MiniLM-L6-v2 Pipeline   │   │ • topicRepository (LocalAdapter) │
│ • 384-dim Dense Vector Embeddings    │   │ • Dexie.js (IndexedDB)           │
│ • Cosine Similarity Calculation      │   │   ├── 'topics' table             │
│ • Keyword-Overlap Fallback           │   │   ├── 'links' table              │
│ • Dynamic Graph Link Computation     │   │   └── 'images' table             │
└──────────────────────────────────────┘   └──────────────────────────────────┘
```

---

##  How the Semantic Engine Works

### 1. Vector Extraction
Whenever a topic is created or updated, its text content (title, preview summary, and note body) is assembled into a single text representation:

$$\text{CombinedText} = \text{Title} + \text{"\n"} + \text{PreviewText} + \text{"\n"} + \text{NotesPlainText}$$

The string is passed to `@xenova/transformers` running the quantized `all-MiniLM-L6-v2` model:
- Produces a **384-dimensional vector embedding**.
- Normalizes the output with mean pooling.
- Caches the vector in the topic record in IndexedDB.

### 2. Similarity Matching
Connections are computed pairwise between active topics using standard Cosine Similarity:

$$\text{Similarity}(A, B) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\|_2 \|\mathbf{B}\|_2}$$

- If $\text{Similarity}(A, B) \ge \text{Threshold}$ (default $0.28$), an auto-link is generated.
- Edge width and neon glow intensity visually reflect the similarity score.
- User-hidden links or manual links take precedence over automated calculations.

---

##  Database Schema (IndexedDB via Dexie)

The application uses an internal Dexie database named `ConstellationDB`:

```typescript
// Topics Table
interface Topic {
  id: string;               // UUID primary key
  title: string;            // Topic title
  previewText?: string;     // Short summary for node hover cards
  previewImage?: Blob;      // Optional banner image blob
  notesContent?: any;       // Tiptap ProseMirror JSON document tree
  notesPlainText?: string;  // Plain text extraction for search & vector embedding
  embedding?: number[];     // 384-dimensional vector array
  positionX?: number;       // Persistent X coordinate on the star graph
  positionY?: number;       // Persistent Y coordinate on the star graph
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

// Links Table
interface TopicLink {
  id: string;               // UUID primary key
  sourceTopicId: string;    // Source node UUID
  targetTopicId: string;    // Target node UUID
  type: 'auto' | 'manual' | 'hidden';
  score?: number;           // Similarity score (0.0 to 1.0)
  reason?: string;          // Human-readable rationale for the link
  createdAt: number;
  updatedAt: number;
}

// Images Table
interface StoredImage {
  id: string;               // UUID primary key
  blob: Blob;               // Raw binary image data
  mimeType: string;         // e.g. 'image/png', 'image/jpeg'
  topicId?: string;         // Associated topic UUID
  createdAt: number;
}
```

---

##  Project Directory Structure

```
├── public/                       # Static assets and PWA icons
├── src/
│   ├── components/
│   │   ├── common/               # Reusable widgets (PWA button, offline badge)
│   │   ├── editor/               # Rich text workspace
│   │   │   ├── NotepadEditor.tsx       # Tiptap setup, toolbar, autosave
│   │   │   └── ResizableImageNode.tsx  # Custom React NodeView for resizable images
│   │   ├── graph/                # Constellation graph engine
│   │   │   ├── ConstellationEdge.tsx   # Custom animated glowing edges
│   │   │   ├── ConstellationNode.tsx   # Star node and hover preview card
│   │   │   └── GraphView.tsx           # React Flow canvas and viewport tracker
│   │   └── modals/               # Modals (Topic create/edit, JSON Backup/Restore)
│   ├── data/
│   │   ├── db.ts                 # Dexie.js database definition
│   │   ├── repository.ts         # Repository pattern abstraction & serialization
│   │   ├── seedData.ts           # Initial sample knowledge constellation
│   │   ├── seedEmbeddings.ts     # Pre-calculated vector embeddings for seed topics
│   │   └── types.ts              # Core TypeScript interfaces
│   ├── hooks/                    # Custom React hooks (usePWAInstall, useOnlineStatus)
│   ├── pages/
│   │   ├── GraphPage.tsx         # Main interactive star-map view
│   │   └── TopicNotesPage.tsx    # Topic study notes view (75% fluid layout)
│   ├── services/
│   │   ├── embeddingService.ts   # HuggingFace Transformers.js pipeline & math
│   │   └── linkingService.ts     # Graph edge evaluation & connection algorithms
│   ├── store/
│   │   └── useConstellationStore.ts # Central Zustand state management
│   ├── App.tsx                   # React Router entry point
│   ├── index.css                 # Tailwind CSS v4 and typography styling
│   └── main.tsx                  # Application bootstrap
├── package.json                  # Dependencies and scripts
└── vite.config.ts                # Vite build configuration & PWA plugins
```

---

##  Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd constellation

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application runs at `http://localhost:3000`.

### Building for Production
```bash
# Run TypeScript compilation and Vite production build
npm run build

# Preview the production build locally
npm run preview
```

---

##  Privacy & Security Principles
- **No Cloud Database Required:** All topics, notes, images, and relationship graphs reside on your device in your browser's IndexedDB.
- **Zero Third-Party Model APIs:** Embeddings are generated purely client-side via Transformers.js in WebAssembly without external API calls.
- **Offline First:** Once cached, the application functions identically offline, allowing you to study on flights, during commutes, or in low-connectivity environments.

---

##  License
MIT License. Feel free to use and adapt this project for your personal research, study, and knowledge management needs.
