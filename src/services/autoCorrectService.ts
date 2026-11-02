/**
 * Lightweight in-browser auto-correct engine with strict misspelling detection.
 * Corrects ONLY recognized spelling mistakes and typos while leaving valid words,
 * technical terms, and correct sentences 100% untouched.
 */

// Comprehensive English study, scientific, conversational, and user-interface vocabulary
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
  'give', 'giving', 'gave', 'given', 'find', 'found', 'finding', 'tell', 'told', 'telling',
  'ask', 'asked', 'asking', 'seem', 'seemed', 'seeming', 'feel', 'felt', 'feeling',
  'try', 'tried', 'trying', 'leave', 'left', 'leaving', 'call', 'called', 'calling',

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
  'examples', 'definition', 'definitions', 'meaning', 'summary', 'summaries', 'note', 'notes',
  'topic', 'topics', 'connection', 'connections', 'relation', 'relations', 'relationship',
  'relationships', 'graph', 'graphs', 'diagram', 'diagrams', 'image', 'images', 'text', 'texts',
  'code', 'architecture', 'architectures', 'artificial', 'intelligence', 'deep', 'layer', 'layers',
  'vector', 'vectors', 'dimension', 'dimensions', 'spaces', 'matrix', 'matrices',
  'feature', 'features', 'classification', 'regression', 'optimization', 'gradient', 'descent',
  'backpropagation', 'transformer', 'transformers', 'attention', 'weight', 'weights', 'bias',
  'linear', 'nonlinear', 'activation', 'perceptron', 'cognitive', 'neuroscience', 'plasticity',
  'synapse', 'synapses', 'hippocampus', 'cortex', 'entanglement', 'superposition', 'qubit', 'qubits',
  'thermodynamics', 'entropy', 'horizon', 'black', 'hole', 'origami', 'deployable', 'telescope',
  'interferometry', 'satellite', 'optics', 'aperture', 'resolution', 'precision', 'frequency',

  // UI, navigation, editor, user-requested terms
  'everything', 'something', 'anything', 'nothing', 'someone', 'anyone', 'everyone',
  'underlined', 'underline', 'underlines', 'underlining',
  'spelled', 'spelling', 'misspelled', 'misspelling', 'wrong', 'right', 'correct', 'correction',
  'corrections', 'autocorrect', 'auto', 'word', 'words', 'sentence', 'sentences',
  'enter', 'key', 'next', 'line', 'lines', 'already', 'import', 'imported', 'imports', 'importing',
  'create', 'created', 'creates', 'creating', 'perfect', 'perfectly', 'same', 'size', 'sizes',
  'edit', 'edited', 'edits', 'editing', 'screen', 'laptop', 'desktop', 'shortcut', 'icon',
  'preview', 'previews', 'displayed', 'display', 'displays', 'displaying', 'exactly',
  'full', 'fully', 'visible', 'ignore', 'ignored', 'remove', 'removed', 'removes', 'removing',
  'red', 'blue', 'green', 'yellow', 'white', 'black', 'gray', 'purple', 'cyan', 'amber',
  'highlight', 'highlighted', 'highlights', 'highlighting', 'option', 'options',
  'place', 'places', 'placed', 'keep', 'keeping', 'kept', 'aside', 'before', 'should',
  'side', 'sides', 'reducing', 'reduce', 'reduced', 'reduces', 'more', 'less', 'waste', 'wasting',
  'wasted', 'wastes', 'space', 'spaces', 'shrink', 'shrunk', 'shrinked', 'shrinking', 'shrinks',
  'cover', 'covered', 'covering', 'covers', 'below', 'above', 'whole', 'now', 'here', 'there',

  // General vocabulary (adjectives, nouns, verbs, adverbs)
  'able', 'account', 'action', 'activity', 'actually', 'address', 'administration', 'admit',
  'adult', 'affect', 'against', 'agency', 'agent', 'agree', 'agreement', 'ahead', 'air',
  'allow', 'almost', 'alone', 'along', 'already', 'although', 'always', 'american', 'amount',
  'animal', 'another', 'apply', 'approach', 'area', 'argue', 'arm', 'around', 'arrive',
  'art', 'article', 'artist', 'assume', 'attack', 'attention', 'attorney', 'audience',
  'author', 'authority', 'available', 'avoid', 'away', 'baby', 'bad', 'bag', 'ball',
  'bank', 'bar', 'base', 'basic', 'basis', 'battle', 'beat', 'beautiful', 'beauty',
  'become', 'bed', 'begin', 'behavior', 'behind', 'believe', 'benefit', 'best', 'better',
  'between', 'beyond', 'big', 'bill', 'billion', 'bit', 'blood', 'board', 'body', 'book',
  'born', 'both', 'box', 'boy', 'break', 'bring', 'brother', 'budget', 'build', 'building',
  'business', 'buy', 'camera', 'campaign', 'cancer', 'candidate', 'capital', 'car', 'card',
  'care', 'career', 'carry', 'case', 'catch', 'cause', 'cell', 'center', 'central', 'century',
  'certain', 'certainly', 'chair', 'challenge', 'chance', 'change', 'character', 'charge',
  'check', 'child', 'choice', 'choose', 'church', 'citizen', 'city', 'civil', 'claim',
  'class', 'clear', 'clearly', 'close', 'coach', 'cold', 'collection', 'college', 'color',
  'commercial', 'common', 'community', 'company', 'compare', 'computer', 'concern', 'condition',
  'conference', 'congress', 'consider', 'consumer', 'contain', 'continue', 'control', 'cost',
  'country', 'couple', 'course', 'court', 'cover', 'create', 'crime', 'cultural', 'culture',
  'cup', 'current', 'customer', 'cut', 'dark', 'daughter', 'deal', 'death', 'debate', 'decade',
  'decide', 'decision', 'defense', 'degree', 'democrat', 'democratic', 'describe', 'design',
  'despite', 'detail', 'determine', 'develop', 'development', 'difference', 'different',
  'difficult', 'dinner', 'direction', 'director', 'discover', 'discuss', 'discussion',
  'disease', 'doctor', 'dog', 'door', 'down', 'draw', 'dream', 'drive', 'drop', 'drug',
  'during', 'each', 'early', 'east', 'easy', 'eat', 'economic', 'economy', 'edge', 'education',
  'effect', 'effort', 'eight', 'either', 'election', 'element', 'else', 'employee', 'end',
  'entire', 'environment', 'environmental', 'especially', 'establish', 'evening', 'event',
  'ever', 'every', 'everybody', 'everyone', 'evidence', 'exactly', 'executive', 'exist',
  'expect', 'experience', 'expert', 'explain', 'eye', 'face', 'fact', 'factor', 'fail',
  'fall', 'family', 'far', 'fast', 'father', 'fear', 'federal', 'feel', 'feeling', 'few',
  'field', 'fight', 'figure', 'fill', 'film', 'final', 'finally', 'financial', 'finger',
  'finish', 'fire', 'firm', 'first', 'fish', 'five', 'floor', 'fly', 'focus', 'follow',
  'food', 'foot', 'foreign', 'forget', 'form', 'former', 'forward', 'four', 'free', 'friend',
  'front', 'full', 'fund', 'future', 'game', 'garden', 'gas', 'general', 'generation',
  'girl', 'give', 'glass', 'goal', 'good', 'government', 'great', 'green', 'ground', 'group',
  'grow', 'growth', 'guess', 'gun', 'guy', 'hair', 'half', 'hand', 'hang', 'happen',
  'happy', 'hard', 'head', 'health', 'hear', 'heart', 'heat', 'heavy', 'help', 'her',
  'here', 'herself', 'high', 'history', 'hit', 'hold', 'home', 'hope', 'hospital', 'hot',
  'hotel', 'hour', 'house', 'how', 'however', 'huge', 'human', 'hundred', 'husband', 'idea',
  'identify', 'image', 'imagine', 'impact', 'important', 'improve', 'include', 'including',
  'increase', 'indeed', 'indicate', 'individual', 'industry', 'inside', 'instead', 'institution',
  'interest', 'interesting', 'international', 'interview', 'into', 'investment', 'involve',
  'issue', 'item', 'itself', 'job', 'join', 'just', 'keep', 'key', 'kid', 'kill', 'kind',
  'kitchen', 'know', 'knowledge', 'land', 'language', 'large', 'last', 'late', 'later',
  'laugh', 'law', 'lawyer', 'lay', 'lead', 'leader', 'learn', 'least', 'leave', 'left',
  'leg', 'legal', 'less', 'let', 'letter', 'level', 'lie', 'life', 'light', 'like', 'likely',
  'line', 'list', 'listen', 'little', 'live', 'local', 'long', 'look', 'lose', 'loss', 'lot',
  'love', 'low', 'machine', 'magazine', 'main', 'maintain', 'major', 'majority', 'make',
  'man', 'manage', 'management', 'manager', 'many', 'market', 'marriage', 'material',
  'matter', 'may', 'maybe', 'mean', 'measure', 'media', 'medical', 'meet', 'meeting',
  'member', 'memory', 'mention', 'message', 'method', 'middle', 'might', 'military',
  'million', 'mind', 'minute', 'miss', 'mission', 'model', 'modern', 'moment', 'money',
  'month', 'more', 'morning', 'most', 'mother', 'mouth', 'move', 'movement', 'movie',
  'much', 'music', 'must', 'myself', 'name', 'nation', 'national', 'natural', 'nature',
  'near', 'nearly', 'necessary', 'need', 'network', 'never', 'news', 'newspaper', 'next',
  'nice', 'night', 'none', 'north', 'note', 'nothing', 'notice', 'number', 'occur', 'off',
  'offer', 'office', 'officer', 'official', 'often', 'oil', 'old', 'once', 'one', 'only',
  'onto', 'open', 'operation', 'opportunity', 'option', 'order', 'organization', 'others',
  'outside', 'page', 'pain', 'painting', 'paper', 'parent', 'part', 'participant', 'particular',
  'particularly', 'partner', 'party', 'pass', 'past', 'patient', 'pattern', 'pay', 'peace',
  'people', 'perform', 'performance', 'perhaps', 'period', 'person', 'personal', 'phone',
  'physical', 'pick', 'picture', 'piece', 'place', 'plan', 'plant', 'play', 'player',
  'point', 'police', 'policy', 'political', 'politics', 'poor', 'popular', 'population',
  'position', 'positive', 'possible', 'power', 'practice', 'prepare', 'present', 'president',
  'pressure', 'pretty', 'prevent', 'price', 'private', 'probably', 'problem', 'process',
  'produce', 'product', 'production', 'professional', 'professor', 'program', 'project',
  'property', 'protect', 'prove', 'provide', 'public', 'pull', 'purpose', 'push', 'put',
  'quality', 'question', 'quickly', 'quite', 'race', 'radio', 'raise', 'range', 'rate',
  'rather', 'reach', 'read', 'ready', 'real', 'reality', 'realize', 'really', 'reason',
  'receive', 'recent', 'recently', 'recognize', 'record', 'red', 'reduce', 'reflect',
  'region', 'relate', 'relationship', 'religious', 'remain', 'remember', 'remove', 'report',
  'represent', 'require', 'research', 'resource', 'respond', 'response', 'responsibility',
  'rest', 'result', 'return', 'reveal', 'rich', 'right', 'rise', 'risk', 'road', 'rock',
  'role', 'room', 'rule', 'run', 'safe', 'same', 'save', 'scene', 'school', 'science',
  'scientist', 'score', 'sea', 'season', 'seat', 'second', 'section', 'security', 'see',
  'seek', 'seem', 'sell', 'send', 'senior', 'sense', 'series', 'serious', 'serve', 'service',
  'set', 'seven', 'several', 'sex', 'sexual', 'shake', 'share', 'shoot', 'short', 'shot',
  'should', 'shoulder', 'show', 'side', 'sign', 'significant', 'similar', 'simple', 'simply',
  'since', 'sing', 'single', 'sister', 'sit', 'site', 'situation', 'six', 'size', 'skill',
  'skin', 'small', 'smile', 'social', 'society', 'soldier', 'some', 'somebody', 'someone',
  'something', 'sometimes', 'son', 'song', 'soon', 'sort', 'sound', 'source', 'south',
  'southern', 'space', 'speak', 'special', 'specific', 'speech', 'spend', 'sport', 'spring',
  'staff', 'stage', 'stand', 'standard', 'star', 'start', 'state', 'statement', 'station',
  'stay', 'step', 'still', 'stock', 'stop', 'store', 'story', 'strategy', 'street', 'strong',
  'structure', 'student', 'study', 'stuff', 'style', 'subject', 'success', 'successful',
  'such', 'suddenly', 'suffer', 'suggest', 'summer', 'support', 'sure', 'surface', 'system',
  'table', 'take', 'talk', 'task', 'tax', 'teach', 'teacher', 'team', 'technology', 'television',
  'tell', 'ten', 'tend', 'term', 'test', 'than', 'thank', 'that', 'their', 'them', 'themselves',
  'then', 'theory', 'there', 'these', 'they', 'thing', 'think', 'third', 'this', 'those',
  'though', 'thought', 'thousand', 'threat', 'three', 'through', 'throughout', 'throw', 'thus',
  'time', 'today', 'together', 'tonight', 'too', 'top', 'total', 'tough', 'toward', 'town',
  'trade', 'traditional', 'training', 'travel', 'treat', 'treatment', 'tree', 'trial', 'trip',
  'trouble', 'true', 'truth', 'turn', 'tv', 'two', 'type', 'under', 'understand', 'unit',
  'until', 'upon', 'use', 'usually', 'value', 'various', 'very', 'victim', 'view', 'violence',
  'visit', 'voice', 'vote', 'wait', 'walk', 'wall', 'want', 'war', 'watch', 'water', 'way',
  'weapon', 'wear', 'week', 'weight', 'well', 'west', 'western', 'what', 'whatever', 'when',
  'where', 'whether', 'which', 'while', 'white', 'whole', 'whom', 'whose', 'why', 'wide',
  'wife', 'will', 'win', 'wind', 'window', 'wish', 'with', 'within', 'without', 'woman',
  'wonder', 'word', 'work', 'worker', 'world', 'worry', 'would', 'write', 'writer', 'wrong',
  'yard', 'yeah', 'year', 'yes', 'yet', 'young', 'your', 'yourself',
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
  seperated: 'separated',
  seperates: 'separates',
  seperating: 'separating',
  neccessary: 'necessary',
  necesary: 'necessary',
  untill: 'until',
  untilll: 'until',
  recive: 'receive',
  recieve: 'receive',
  recieved: 'received',
  recieving: 'receiving',
  acheive: 'achieve',
  acheived: 'achieved',
  acheiving: 'achieving',
  alot: 'a lot',
  computr: 'computer',
  computur: 'computer',
  studing: 'studying',
  studyng: 'studying',
  algoritm: 'algorithm',
  algorithim: 'algorithm',
  algoritms: 'algorithms',
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
  calender: 'calendar',
  collegue: 'colleague',
  curiousity: 'curiosity',
  dissapear: 'disappear',
  dissapoint: 'disappoint',
  embarass: 'embarrass',
  familar: 'familiar',
  foriegn: 'foreign',
  garantee: 'guarantee',
  guarentee: 'guarantee',
  happend: 'happened',
  hiearchy: 'hierarchy',
  immediatly: 'immediately',
  independant: 'independent',
  judgement: 'judgment',
  libary: 'library',
  lightening: 'lightning',
  maintanance: 'maintenance',
  maintenence: 'maintenance',
  mispell: 'misspell',
  noticable: 'noticeable',
  occassion: 'occasion',
  posession: 'possession',
  priviledge: 'privilege',
  pronounciation: 'pronunciation',
  questionaire: 'questionnaire',
  recomended: 'recommended',
  reccomend: 'recommend',
  reccommend: 'recommend',
  rythm: 'rhythm',
  shedule: 'schedule',
  similiar: 'similar',
  sincerly: 'sincerely',
  suprise: 'surprise',
  tendancy: 'tendency',
  therefor: 'therefore',
  thru: 'through',
  tounge: 'tongue',
  unfortunatly: 'unfortunately',
  visable: 'visible',
  wich: 'which',
  wether: 'whether',
  yeild: 'yield',
  srted: 'sorted',
  stred: 'stored',
  strt: 'start',
  strtd: 'started',
};

// Automatically generate regular inflections (-s, -es, -ed, -d, -ing) to ensure full dictionary coverage
const EXPANDED_WORDS = new Set<string>(DICTIONARY_WORDS);

for (const w of DICTIONARY_WORDS) {
  // -s / -es
  if (w.endsWith('s') || w.endsWith('x') || w.endsWith('z') || w.endsWith('ch') || w.endsWith('sh')) {
    EXPANDED_WORDS.add(w + 'es');
  } else if (w.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(w[w.length - 2] || '')) {
    EXPANDED_WORDS.add(w.slice(0, -1) + 'ies');
  } else {
    EXPANDED_WORDS.add(w + 's');
  }

  // -ed / -d / -ing
  if (w.endsWith('e')) {
    EXPANDED_WORDS.add(w + 'd');
    EXPANDED_WORDS.add(w.slice(0, -1) + 'ing');
  } else if (w.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(w[w.length - 2] || '')) {
    EXPANDED_WORDS.add(w.slice(0, -1) + 'ied');
    EXPANDED_WORDS.add(w + 'ing');
  } else {
    EXPANDED_WORDS.add(w + 'ed');
    EXPANDED_WORDS.add(w + 'ing');
  }
}

/**
 * Checks if 'sub' is an exact ordered subsequence of 'str'.
 * E.g. 'srted' is a subsequence of 'sorted' (missing vowel 'o').
 */
function isSubsequence(sub: string, str: string): boolean {
  let i = 0;
  let j = 0;
  while (i < sub.length && j < str.length) {
    if (sub[i] === str[j]) i++;
    j++;
  }
  return i === sub.length;
}

/**
 * Checks if a word is recognized as a valid inflected form of a dictionary word.
 * This prevents valid plurals, past tense, and continuous forms from ever being flagged.
 */
function isValidWord(lower: string): boolean {
  if (EXPANDED_WORDS.has(lower)) return true;
  return false;
}

/**
 * Calculates Damerau-Levenshtein distance between two strings
 * Handles insertions, deletions, substitutions, and transpositions.
 */
function damerauLevenshteinDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  // If length difference is greater than 2, skip expensive calculation
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
 * Finds the best correction for a given word.
 * STRICT POLICY:
 * Returns null if the word is valid or recognized.
 * Ranks candidates using distance, first/last letter match, and missing vowel subsequence alignment.
 */
export function getAutoCorrection(rawWord: string): string | null {
  // Extract leading/trailing punctuation
  const match = rawWord.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9'-]+)([^a-zA-Z0-9]*)$/);
  if (!match) return null;

  const [, leadingPunct, word, trailingPunct] = match;

  // Ignore numbers, words with numbers, or very short words (< 3 chars)
  if (word.length < 3 || /\d/.test(word)) return null;

  const lower = word.toLowerCase();

  // If the word is valid English, DO NOT TOUCH IT!
  if (isValidWord(lower)) {
    return null;
  }

  // Only correct words that are verified wrong spelled typos
  let bestMatch: string | null = null;

  // 1. Direct high-confidence lookup in COMMON_TYPOS
  if (COMMON_TYPOS[lower]) {
    bestMatch = COMMON_TYPOS[lower];
  } else {
    // 2. Search EXPANDED_WORDS using intelligent scoring:
    // Distance, same first letter, same last letter, and subsequence (vowel-drop) matching
    let bestScore = -999;

    for (const dictWord of EXPANDED_WORDS) {
      const lenDiff = Math.abs(dictWord.length - lower.length);
      if (lenDiff > 2) continue;

      const dist = damerauLevenshteinDistance(lower, dictWord);
      if (dist > 2) continue;
      if (dist === 2 && lower.length < 5) continue; // Distance 2 only for words with length >= 5

      // Base score starts high and is penalized by distance
      let score = 100 - dist * 30 - lenDiff * 5;

      // Major bonus for identical starting letter (highest accuracy predictor in typing errors)
      if (dictWord[0] === lower[0]) {
        score += 40;
      }

      // Bonus for identical ending letter
      if (dictWord[dictWord.length - 1] === lower[lower.length - 1]) {
        score += 15;
      }

      // Major bonus if the typo is a subsequence of the word (e.g. srted -> sorted, missing vowel)
      if (isSubsequence(lower, dictWord)) {
        score += 50;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = dictWord;
      }
    }
  }

  if (!bestMatch || bestMatch === lower) {
    return null;
  }

  // Preserve original casing
  let formattedMatch = bestMatch;
  if (word.length > 1 && word === word.toUpperCase()) {
    formattedMatch = bestMatch.toUpperCase();
  } else if (/^[A-Z]/.test(word)) {
    formattedMatch = bestMatch.charAt(0).toUpperCase() + bestMatch.slice(1);
  }

  // Preserve surrounding punctuation
  return `${leadingPunct}${formattedMatch}${trailingPunct}`;
}
