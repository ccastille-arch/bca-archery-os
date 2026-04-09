// ==================== SCORING & ROUND TYPES ====================

export type ScoringMode =
  | 'standard'      // 0-10, X=10 (outdoor target)
  | 'asa-3d'        // 5, 8, 10, 12 (14 for pro)
  | 'ibo-3d'        // 5, 8, 10, 11
  | 'nfaa-indoor'   // X, 5, 4, 3, 2, 1, M (5-spot)
  | 'nfaa-field'    // 5, 4, 3, 2, 1, M
  | 'vegas'         // X, 10, 9, ... (single spot 40cm)
  | 'wa-outdoor'    // X, 10, 9, ... (World Archery)
  | 'lancaster'     // X, 10, 9, ... (3-spot vertical)
  | 'hunting';      // practice, no formal scoring

export type RoundFormat =
  | 'practice'
  | 'nfaa-300'      // 60 arrows, 5 per end
  | 'nfaa-field-14' // 14 targets
  | 'nfaa-field-28' // 28 targets
  | 'wa-720'        // 72 arrows at 70m
  | 'wa-1440'       // 144 arrows multi-distance
  | 'vegas-300'     // 30 arrows, 3 per end
  | 'asa-20'        // 20 3D targets
  | 'ibo-30'        // 30 3D targets
  | 'lancaster-60'  // 60 arrows
  | 'league'
  | 'custom';

// Score values per mode
export const SCORING_VALUES: Record<ScoringMode, { values: number[]; labels: string[]; maxPerArrow: number }> = {
  'standard':    { values: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], labels: ['X', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'], maxPerArrow: 10 },
  'asa-3d':      { values: [14, 12, 10, 8, 5, 0], labels: ['14', '12', '10', '8', '5', 'M'], maxPerArrow: 14 },
  'ibo-3d':      { values: [11, 10, 8, 5, 0], labels: ['11', '10', '8', '5', 'M'], maxPerArrow: 11 },
  'nfaa-indoor':  { values: [5, 5, 4, 3, 2, 1, 0], labels: ['X', '5', '4', '3', '2', '1', 'M'], maxPerArrow: 5 },
  'nfaa-field':  { values: [5, 4, 3, 2, 1, 0], labels: ['5', '4', '3', '2', '1', 'M'], maxPerArrow: 5 },
  'vegas':       { values: [10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], labels: ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'], maxPerArrow: 10 },
  'wa-outdoor':  { values: [10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], labels: ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'], maxPerArrow: 10 },
  'lancaster':   { values: [10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], labels: ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'], maxPerArrow: 10 },
  'hunting':     { values: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], labels: ['X', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'], maxPerArrow: 10 },
};

export const SCORING_MODE_LABELS: Record<ScoringMode, string> = {
  'standard': 'Standard Target',
  'asa-3d': 'ASA 3D',
  'ibo-3d': 'IBO 3D',
  'nfaa-indoor': 'NFAA Indoor (5-Spot)',
  'nfaa-field': 'NFAA Field',
  'vegas': 'Vegas (Single Spot)',
  'wa-outdoor': 'World Archery Outdoor',
  'lancaster': 'Lancaster (3-Spot)',
  'hunting': 'Hunting Practice',
};

export const ROUND_FORMAT_LABELS: Record<RoundFormat, string> = {
  'practice': 'Practice',
  'nfaa-300': 'NFAA 300 (60 arrows)',
  'nfaa-field-14': 'NFAA Field (14 targets)',
  'nfaa-field-28': 'NFAA Field (28 targets)',
  'wa-720': 'WA 720 (72 arrows)',
  'wa-1440': 'WA 1440 (144 arrows)',
  'vegas-300': 'Vegas 300 (30 arrows)',
  'asa-20': 'ASA (20 targets)',
  'ibo-30': 'IBO (30 targets)',
  'lancaster-60': 'Lancaster (60 arrows)',
  'league': 'League Night',
  'custom': 'Custom',
};

// ==================== STABILIZER ====================

export interface StabilizerBar {
  brand: string;
  model: string;
  length: string;
  weight: string;
  angle?: string;   // degrees, for back bars and side rods
}

// ==================== EQUIPMENT ====================

export interface BowConfig {
  id: string;
  name: string;
  // Basic
  bowType: 'compound' | 'recurve' | 'traditional' | 'crossbow';
  bowModel: string;
  drawWeight: string;
  drawLength: string;
  // Compound-specific
  axleToAxle: string;
  braceHeight: string;
  letOff: string;
  camType: string;
  // Accessories
  restType: string;
  releaseType: string;
  peepSize: string;
  scopeLens: string;
  dLoop: string;
  // String
  stringBrand: string;
  stringMaterial: string;
  // Stabilizers (multi-bar)
  frontStabilizer: StabilizerBar;
  backBars: StabilizerBar[];
  sideRods: StabilizerBar[];
  vBarSetup: string;
  // Meta
  notes: string;
  createdAt: string;
}

export interface ArrowConfig {
  id: string;
  name: string;
  shaftModel: string;
  spine: string;
  length: string;
  fletchType: string;
  fletchOffset: string;
  nockType: string;
  pointWeight: string;
  insertType: string;
  insertWeight: string;
  totalArrowWeight: string;
  foc: string;
  wrapType: string;
  arrowCount: number;
  notes: string;
  createdAt: string;
}

// ==================== SHOT LOGGING ====================

export interface ShotEnd {
  id: string;
  date: string;
  distance: number;
  arrowCount: number;
  scores: number[];
  scoringMode: ScoringMode;
  roundFormat: RoundFormat;
  targetFace: string;
  elevation: 'flat' | 'uphill' | 'downhill' | 'treestand';
  rangeType: 'known' | 'unknown';
  conditions: {
    wind: 'none' | 'light' | 'moderate' | 'heavy';
    weather: 'clear' | 'cloudy' | 'rain' | 'snow';
    indoor: boolean;
  };
  notes: string;
  sessionId?: string;
  bowConfigId?: string;
  arrowConfigId?: string;
}

// ==================== SIGHT PROFILES ====================

export interface SightProfile {
  id: string;
  name: string;
  bowName: string;
  arrowSetup: string;
  sightModel: string;
  marks: SightMark[];
  createdAt: string;
}

export interface SightMark {
  distance: number;
  mark: number;
}

// ==================== SESSIONS ====================

export interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  goal: string;
  totalArrows: number;
  endIds: string[];
  notes: string;
  scoringMode?: ScoringMode;
  roundFormat?: RoundFormat;
  bowConfigId?: string;
  arrowConfigId?: string;
}

// ==================== STABILIZER TESTING ====================

export interface StabilizerTest {
  id: string;
  date: string;
  bowConfigId?: string;
  setup: {
    frontBar: StabilizerBar;
    backBars: StabilizerBar[];
    sideRods: StabilizerBar[];
    vBarBrand: string;
    quickDisconnect: string;
    totalWeight: string;
  };
  distance: number;
  groupSize: string;
  holdFeeling: 'dead' | 'slight-float' | 'active-float' | 'jumpy';
  balancePoint: 'nose-heavy' | 'balanced' | 'back-heavy';
  shotFeel: number;
  recoilDirection: 'forward' | 'back' | 'left' | 'right' | 'neutral';
  notes: string;
  isFavorite: boolean;
}

// ==================== TUNING LOG ====================

export interface TuneLog {
  id: string;
  date: string;
  bowConfigId?: string;
  arrowConfigId?: string;
  tuneType: 'paper' | 'walk-back' | 'french' | 'bare-shaft' | 'broadhead' | 'group' | 'other';
  restPosition: string;
  nockHeight: string;
  camTiming: string;
  tearDirection: string;
  result: 'bullet-hole' | 'improving' | 'worse' | 'no-change';
  notes: string;
}

// ==================== TOURNAMENTS ====================

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  organization: 'asa' | 'ibo' | 'nfaa' | 'usa-archery' | 'wa' | 'local' | 'other';
  roundFormat: RoundFormat;
  scoringMode: ScoringMode;
  bowClass: string;
  totalScore: number;
  maxPossible: number;
  placement: string;
  endIds: string[];
  bowConfigId?: string;
  arrowConfigId?: string;
  notes: string;
}
