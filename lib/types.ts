export interface ShotEnd {
  id: string;
  date: string;
  distance: number;
  arrowCount: number;
  scores: number[];
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

export interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  goal: string;
  totalArrows: number;
  endIds: string[];
  notes: string;
  bowConfigId?: string;
  arrowConfigId?: string;
}

export interface BowConfig {
  id: string;
  name: string;
  bowModel: string;
  drawWeight: string;
  drawLength: string;
  restType: string;
  stabilizer: string;
  releaseType: string;
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
  nockType: string;
  pointWeight: string;
  notes: string;
  createdAt: string;
}
