import type { Topic, TopicLink } from './types';
import { SEED_EMBEDDINGS } from './seedEmbeddings';

// Helper to create an SVG blob with celestial/constellation patterns
export function createSvgBlob(colorA: string, colorB: string, iconSymbol: string): Blob {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorA}" />
        <stop offset="100%" stop-color="${colorB}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" rx="16"/>
    <circle cx="200" cy="120" r="70" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="4 4" />
    <circle cx="160" cy="90" r="6" fill="#ffffff" opacity="0.8"/>
    <circle cx="240" cy="150" r="5" fill="#ffffff" opacity="0.8"/>
    <circle cx="230" cy="80" r="4" fill="#ffffff" opacity="0.7"/>
    <line x1="160" y1="90" x2="240" y2="150" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
    <line x1="160" y1="90" x2="230" y2="80" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
    <text x="200" y="130" font-family="system-ui, sans-serif" font-size="36" fill="#ffffff" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${iconSymbol}</text>
  </svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

export const SEED_TOPIC_IDS = {
  neuralNetworks: 'topic-neural-networks',
  deepLearning: 'topic-deep-learning',
  cognitiveNeuro: 'topic-cognitive-neuroscience',
  quantumComputing: 'topic-quantum-computing',
  cosmology: 'topic-cosmology-black-holes',
  computationalOrigami: 'topic-computational-origami',
  spaceTelescopeArrays: 'topic-space-telescope-arrays',
};

export const INITIAL_SEEDS: Topic[] = [
  {
    id: SEED_TOPIC_IDS.neuralNetworks,
    title: 'Artificial Neural Networks',
    previewText: 'Computational structures inspired by biological neurons, forming the mathematical backbone of modern AI.',
    previewImage: createSvgBlob('#1e1b4b', '#312e81', '🧠'),
    notesPlainText: 'Artificial Neural Networks (ANNs) are parallel distributed information processors. They consist of connected nodes called artificial neurons, patterned after the human brain.\n\nKey Concepts:\n- Perceptrons and Multi-layer Perceptrons\n- Forward propagation and Activation Functions (ReLU, GELU, Sigmoid)\n- Backpropagation and Gradient Descent optimization\n\nRelated to Deep Learning architectures and insights from Cognitive Neuroscience.',
    notesContent: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Artificial Neural Networks' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Artificial Neural Networks (ANNs) are parallel distributed information processors. They consist of connected nodes called artificial neurons, patterned loosely after the human brain and biological nervous systems.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Foundational Pillars' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Perceptrons and Multi-layer Perceptrons (MLPs)' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Forward propagation and non-linear activation functions (ReLU, GELU, Sigmoid)' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Backpropagation using chain rule calculus with Adam/SGD optimizers' }],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Modern advancements directly link this to Deep Learning paradigms and theoretical models studied in Cognitive Neuroscience.',
            },
          ],
        },
      ],
    },
    positionX: 300,
    positionY: 260,
    createdAt: Date.now() - 3600000 * 24 * 3,
    updatedAt: Date.now() - 3600000 * 2,
    deleted: false,
    synced: false,
  },
  {
    id: SEED_TOPIC_IDS.deepLearning,
    title: 'Deep Learning',
    previewText: 'Hierarchical representation learning using deep neural architectures such as Transformers and CNNs.',
    previewImage: createSvgBlob('#0f172a', '#1e293b', '⚡'),
    notesPlainText: 'Deep Learning is a subset of machine learning based on artificial neural networks with multiple representation layers.\n\nArchitectures:\n- Convolutional Neural Networks (CNNs) for vision\n- Transformers with multi-head self-attention mechanisms\n- Diffusion models for generative synthesis\n\nDeep learning requires massive compute, often drawing inspiration from parallel processing architectures, which intersects with developments in Quantum Computing.',
    notesContent: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Deep Learning Architectures' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Deep Learning investigates hierarchical representation learning through deep layered models. By composing non-linear transformations, systems learn representations at increasingly abstract levels.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Core Architectures' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Transformers with scaled dot-product attention' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Convolutional neural networks for spatial feature maps' }],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'High-dimensional tensor contractions and quantum-inspired tensor networks provide surprising bridges toward Quantum Computing.',
            },
          ],
        },
      ],
    },
    positionX: 580,
    positionY: 180,
    createdAt: Date.now() - 3600000 * 24 * 2,
    updatedAt: Date.now() - 3600000,
    deleted: false,
    synced: false,
  },
  {
    id: SEED_TOPIC_IDS.cognitiveNeuro,
    title: 'Cognitive Neuroscience',
    previewText: 'Study of biological mechanisms underlying mental processes, synaptogenesis, and memory consolidation.',
    previewImage: createSvgBlob('#14532d', '#064e3b', '🧬'),
    notesPlainText: 'Cognitive Neuroscience explores biological mechanisms underlying cognition, memory, and perception. It examines how neural circuits in the cortex give rise to thought, memory consolidation, and conscious experience.\n\nKey Mechanisms:\n- Long-Term Potentiation (LTP) and synaptic plasticity\n- Neural oscillations and phase synchrony\n- Hippocampal cognitive mapping\n\nDirectly inspires Artificial Neural Networks and computational neuroscience.',
    notesContent: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Cognitive Neuroscience & Mind' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Cognitive Neuroscience investigates how brain structures produce cognitive processes, from sensory perception to episodic recall.',
            },
          ],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '"The brain is a complex adaptive network with dynamic balance between segregation and integration."' }],
            },
          ],
        },
      ],
    },
    positionX: 180,
    positionY: 480,
    createdAt: Date.now() - 3600000 * 24 * 5,
    updatedAt: Date.now() - 3600000 * 4,
    deleted: false,
    synced: false,
  },
  {
    id: SEED_TOPIC_IDS.quantumComputing,
    title: 'Quantum Computing',
    previewText: 'Computation exploiting quantum mechanical superposition, entanglement, and interference.',
    previewImage: createSvgBlob('#3b0764', '#581c87', '⚛️'),
    notesPlainText: 'Quantum Computing utilizes qubits rather than classical binary bits. Superposition allows qubits to exist as coherent linear combinations of computational basis states |0> and |1>.\n\nPrinciples:\n- Quantum superposition and entanglement\n- Quantum gates (Hadamard, CNOT, Phase)\n- Quantum speedup and Shor/Grover algorithms\n- Tensor networks and simulation of physical systems',
    notesContent: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Quantum Information & Computing' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Quantum computation operates by manipulating quantum amplitudes across Hilbert space via unitary transformations.',
            },
          ],
        },
      ],
    },
    positionX: 620,
    positionY: 460,
    createdAt: Date.now() - 3600000 * 24 * 4,
    updatedAt: Date.now() - 3600000 * 3,
    deleted: false,
    synced: false,
  },
  {
    id: SEED_TOPIC_IDS.cosmology,
    title: 'Cosmology & Black Holes',
    previewText: 'Spacetime curvature, Hawking radiation, gravitational waves, and the cosmic microwave background.',
    previewImage: createSvgBlob('#022c22', '#064e3b', '🌌'),
    notesPlainText: 'Cosmology and General Relativity describe spacetime as a dynamic 4D pseudo-Riemannian manifold curved by energy and mass.\n\nFocus Areas:\n- Event horizons and Schwarzschild metric\n- Hawking radiation and the black hole information paradox\n- Gravitational wave interferometry\n- Holographic principle connecting bulk gravity to boundary quantum field theories',
    notesContent: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Cosmology & Gravitational Physics' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Einstein field equations dictate that matter tells spacetime how to curve, and curved spacetime tells matter how to move.',
            },
          ],
        },
      ],
    },
    positionX: 420,
    positionY: 620,
    createdAt: Date.now() - 3600000 * 24 * 6,
    updatedAt: Date.now() - 3600000 * 5,
    deleted: false,
    synced: false,
  },
  {
    id: SEED_TOPIC_IDS.computationalOrigami,
    title: 'Computational Origami & Fold Geometry',
    previewText: 'Mathematical crease pattern theorems, Miura-ori tessellations, and rigid origami kinematics.',
    previewImage: createSvgBlob('#1e1b4b', '#4338ca', '📐'),
    notesPlainText: 'Computational origami explores the mathematical laws governing how 2D flat surfaces transform into 3D geometries.\n\nCore Theorems:\n- Maekawa-Justin Theorem: The difference between mountain and valley folds at any flat-foldable vertex is always ±2.\n- Kawasaki Theorem: A single-vertex crease pattern is flat-foldable if and only if alternating sector angles sum to 180°.\n- Miura-ori: A rigid tessellation where rigid facets swivel around crease lines with a single degree of freedom.\n\nApplications span metamaterials, stent delivery, and kinematic deployable solar structures.',
    notesContent: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Computational Origami & Rigid Folding' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Computational origami formalizes the geometry of folding. While traditional origami deforms paper through bending, rigid origami models facets as unyielding polygonal plates connected by hinge creases.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Mathematical Theorems of Flat-Foldability' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Maekawa Theorem: M - V = ±2 for any interior vertex.' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Kawasaki Theorem: Alternating angles around a flat vertex sum to π radians.' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Miura-Ori Pattern: Compact parallelogram tessellation allowing 1-DOF expansion.' }],
                },
              ],
            },
          ],
        },
      ],
    },
    positionX: 920,
    positionY: 160,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 2,
    deleted: false,
    synced: false,
  },
  {
    id: SEED_TOPIC_IDS.spaceTelescopeArrays,
    title: 'Deployable Space Telescope Arrays',
    previewText: 'Kinematic solar wings, stowed rocket payload volumes, and cryogenic sunshield tensioning systems.',
    previewImage: createSvgBlob('#0f172a', '#0369a1', '🛰️'),
    notesPlainText: 'Modern astronomical observatories exceed the physical fairing diameter of launch vehicles, necessitating compact robotic deployment mechanisms.\n\nKey Engineering Considerations:\n- Volumetric packing limits in 5-meter launcher fairings\n- Multi-layer insulation (MLI) and Kapton sunshields (such as the James Webb Space Telescope)\n- Micro-vibration isolation and strain energy deployment hinges\n- In-orbit autonomous unlatching sequences without human intervention.',
    notesContent: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Deployable Space Structures & Solar Arrays' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Space missions are fundamentally bounded by the volumetric payload envelope of launch rockets. Large aperture mirrors and solar arrays must be packed tightly during ascent, then autonomously unfold in deep space.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Critical Deployment Mechanics' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Payload Shroud Packing: Compacting large surface areas into cylindrical rocket fairings.' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Cryogenic Sunshields: Multi-layer Kapton membranes tensioned by telescopic deployment booms.' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Zero-Backlash Hinges: High-precision latching joints that hold optical alignment.' }],
                },
              ],
            },
          ],
        },
      ],
    },
    positionX: 920,
    positionY: 480,
    createdAt: Date.now() - 3600000 * 10,
    updatedAt: Date.now() - 3600000,
    deleted: false,
    synced: false,
  },
].map((t): Topic => ({ ...t, embedding: SEED_EMBEDDINGS[t.id] }));

export const INITIAL_LINKS: TopicLink[] = [
  {
    id: 'link-nn-dl',
    sourceTopicId: SEED_TOPIC_IDS.neuralNetworks,
    targetTopicId: SEED_TOPIC_IDS.deepLearning,
    type: 'manual',
    score: 0.95,
    reason: 'Manual connection: Deep Learning is founded upon Artificial Neural Networks',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'link-quantum-cosmo',
    sourceTopicId: SEED_TOPIC_IDS.quantumComputing,
    targetTopicId: SEED_TOPIC_IDS.cosmology,
    type: 'auto',
    score: 0.61,
    reason: 'Auto: 61% semantic similarity (quantum mechanics, physics, and information theory)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
