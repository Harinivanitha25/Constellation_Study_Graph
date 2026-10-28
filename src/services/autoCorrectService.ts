/**
 * Lightweight in-browser auto-correct engine with Damerau-Levenshtein distance matching.
 * Runs client-side with zero external API calls.
 */

// Common English words, study terms, scientific & technical vocabulary
const DICTIONARY_WORDS = new Set<string>([
  // Core English words & conjunctions
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were',
  'been', 'being', 'had', 'has', 'having', 'does', 'did', 'doing', 'went', 'gone', 'going',
  'made', 'making', 'came', 'coming', 'took', 'taken', 'taking', 'said', 'saying', 'knew', 'known',

  // Common descriptive and study words
  'study', 'studying', 'studied', 'studies', 'research', 'researching', 'concept', 'concepts',
  'theory', 'theories', 'principle', 'principles', 'system', 'systems', 'structure', 'structures',
  'function', 'functions', 'process', 'processes', 'method', 'methods', 'analysis', 'analyses',
  'model', 'models', 'network', 'networks', 'information', 'knowledge', 'learning', 'machine',
  'algorithm', 'algorithms', 'computer', 'science', 'data', 'database', 'memory', 'human',
  'brain', 'mind', 'thought', 'thoughts', 'neural', 'neuron', 'neurons', 'quantum', 'mechanics',
  'physics', 'mathematics', 'geometry', 'biology', 'chemistry', 'cosmology', 'universe', 'space',
  'time', 'energy', 'force', 'gravity', 'equation', 'equations', 'experiment', 'result', 'results',
  'problem', 'problems', 'solution', 'solutions', 'question', 'answer', 'important', 'example',
  'definition', 'meaning', 'summary', 'note', 'notes', 'topic', 'topics', 'connection', 'connections',
  'relation', 'relations', 'relationship', 'graph', 'diagram', 'image', 'images', 'text', 'code',
  'architecture', 'architectures', 'artificial', 'intelligence', 'deep', 'layer', 'layers',
  'vector', 'vectors', 'dimension', 'dimensions', 'space', 'spaces', 'matrix', 'matrices',
  'feature', 'features', 'classification', 'regression', 'optimization', 'gradient', 'descent',
  'backpropagation', 'transformer', 'transformers', 'attention', 'weight', 'weights', 'bias',
  'linear', 'nonlinear', 'activation', 'perceptron', 'cognitive', 'neuroscience', 'plasticity',
  'synapse', 'synapses', 'hippocampus', 'cortex', 'entanglement', 'superposition', 'qubit', 'qubits',
  'thermodynamics', 'entropy', 'horizon', 'black', 'hole', 'origami', 'deployable', 'telescope',
  'interferometry', 'satellite', 'optics', 'aperture', 'resolution', 'precision', 'frequency',

  // Commonly misspelled English words with high frequency
  'definitely', 'separate', 'necessary', 'occurred', 'occurring', 'until', 'receive', 'received',
  'accommodate', 'achieve', 'across', 'almost', 'among', 'apparent', 'argument', 'basically',
  'beginning', 'believe', 'believed', 'business', 'calendar', 'category', 'cemetery', 'colleague',
  'coming', 'committee', 'completely', 'conscious', 'curiosity', 'definitely', 'dilemma',
  'disappear', 'disappoint', 'embarrass', 'environment', 'existence', 'experience', 'familiar',
  'finally', 'foreign', 'forward', 'friend', 'further', 'guarantee', 'guidance', 'happened',
  'harass', 'height', 'hierarchy', 'humorous', 'immediately', 'independent', 'intelligence',
  'interesting', 'judgment', 'knowledge', 'leisure', 'liaison', 'library', 'lightning',
  'maintenance', 'millennium', 'miniature', 'mischievous', 'misspell', 'noticeable', 'occasion',
  'occurred', 'parallel', 'pastime', 'perseverance', 'personnel', 'possession', 'preferable',
  'privilege', 'pronunciation', 'publicly', 'questionnaire', 'really', 'receipt', 'recommend',
  'reference', 'relevant', 'religious', 'repetition', 'rhythm', 'schedule', 'sense', 'sentence',
  'separate', 'similar', 'sincerely', 'speech', 'successful', 'surprise', 'tendency', 'therefore',
  'threshold', 'tomorrow', 'truly', 'twelfth', 'tyranny', 'undoubtedly', 'until', 'vacuum',
  'weather', 'weird', 'wherever', 'whether', 'writing', 'written', 'written', 'without', 'together',
]);

// Curated high-confidence common typo pairs for instant O(1) correction
const COMMON_TYPOS: Record<string, string> = {
  // Transpositions & frequent keystroke errors
  teh: 'the',
  adn: 'and',
  waht: 'what',
  thier: 'their',
  taht: 'that',
  wiht: 'with',
  nad: 'and',
  cna: 'can',
  fro: 'for',
  ot: 'to',
  ti: 'it',
  si: 'is',
  aer: 'are',
  becuase: 'because',
  becasue: 'because',
  becouse: 'because',
  definately: 'definitely',
  definitly: 'definitely',
  definitlyy: 'definitely',
  seperate: 'separate',
  neccessary: 'necessary',
  necesary: 'necessary',
  untill: 'until',
  recive: 'receive',
  recieve: 'receive',
  acheive: 'achieve',
  alot: 'a lot',
  computr: 'computer',
  computur: 'computer',
  studing: 'studying',
  studyng: 'studying',
  algoritm: 'algorithm',
  algorithim: 'algorithm',
  inteligence: 'intelligence',
  inteligente: 'intelligent',
  differnt: 'different',
  diferent: 'different',
  importent: 'important',
  importnat: 'important',
  relavent: 'relevant',
  relevent: 'relevant',
  exampel: 'example',
  exmple: 'example',
  systemm: 'system',
  knowlege: 'knowledge',
  knowlegeable: 'knowledgeable',
  beleive: 'believe',
  belive: 'believe',
  occured: 'occurred',
  occurr: 'occur',
  tommorow: 'tomorrow',
  tomorow: 'tomorrow',
  goverment: 'government',
  enviroment: 'environment',
  untilll: 'until',
  alright: 'all right',
  alread: 'already',
  basicly: 'basically',
  completly: 'completely',
  sucessful: 'successful',
  successfull: 'successful',
  truely: 'truly',
  wierd: 'weird',
  writting: 'writing',
  writen: 'written',
  begining: 'beginning',
  remeber: 'remember',
  freind: 'friend',
  peice: 'piece',
  quantm: 'quantum',
  nerual: 'neural',
  phyiscs: 'physics',
  parrallel: 'parallel',
  reserch: 'research',
  reserching: 'researching',
};

/**
 * Calculates Damerau-Levenshtein distance between two strings
 * Handles insertions, deletions, substitutions, and transpositions.
 */
function damerauLevenshteinDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  // If length difference is greater than 2, skip expensive matrix calculation
  if (Math.abs(al - bl) > 2) return 99;

  const matrix: number[][] = [];
  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let min = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        min = Math.min(min, matrix[i - 2][j - 2] + cost);
      }

      matrix[i][j] = min;
    }
  }

  return matrix[al][bl];
}

/**
 * Checks if a word is capitalized (first letter uppercase)
 */
function isCapitalized(word: string): boolean {
  return /^[A-Z]/.test(word);
}

/**
 * Checks if a word is in ALL CAPS
 */
function isAllCaps(word: string): boolean {
  return word.length > 1 && word === word.toUpperCase();
}

/**
 * Finds the best auto-correction for a given word.
 * Returns null if the word is already valid or no high-confidence correction exists.
 */
export function getAutoCorrection(rawWord: string): string | null {
  // Strip trailing/leading punctuation
  const match = rawWord.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9'-]+)([^a-zA-Z0-9]*)$/);
  if (!match) return null;

  const [, leadingPunct, word, trailingPunct] = match;

  // Ignore numbers, very short words (< 3 chars), or words with numbers
  if (word.length < 3 || /\d/.test(word)) return null;

  const lower = word.toLowerCase();

  // If already a valid word in dictionary, no correction needed
  if (DICTIONARY_WORDS.has(lower)) {
    return null;
  }

  let bestMatch: string | null = null;

  // 1. Check direct instant typo mapping
  if (COMMON_TYPOS[lower]) {
    bestMatch = COMMON_TYPOS[lower];
  } else {
    // 2. Search dictionary using Damerau-Levenshtein distance
    let minDistance = 3; // Maximum allowed distance is 2

    for (const dictWord of DICTIONARY_WORDS) {
      // Length prune: if lengths differ by more than 2, skip
      if (Math.abs(dictWord.length - lower.length) > 2) continue;

      const dist = damerauLevenshteinDistance(lower, dictWord);
      if (dist === 1) {
        // Distance 1 is a direct single-letter typo or transposition (highest confidence)
        bestMatch = dictWord;
        minDistance = 1;
        break; // Stop early on distance 1
      } else if (dist === 2 && minDistance > 2 && lower.length >= 5) {
        // Distance 2 allowed only for words with at least 5 letters to avoid false positives
        bestMatch = dictWord;
        minDistance = 2;
      }
    }
  }

  if (!bestMatch || bestMatch === lower) {
    return null;
  }

  // Restore casing
  let formattedMatch = bestMatch;
  if (isAllCaps(word)) {
    formattedMatch = bestMatch.toUpperCase();
  } else if (isCapitalized(word)) {
    formattedMatch = bestMatch.charAt(0).toUpperCase() + bestMatch.slice(1);
  }

  // Restore punctuation
  return `${leadingPunct}${formattedMatch}${trailingPunct}`;
}
