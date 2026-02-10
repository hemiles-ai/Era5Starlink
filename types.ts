
export interface RecognitionResult {
  name: string;
  category: string;
  description: string;
  funFact: string;
  visualPrompt: string;
  confidence: number;
  referenceImage?: string;
  weatherFacts?: string;
}

export interface Marker {
  id: string;
  x: number;
  y: number;
  label: string;
}

export enum AppStatus {
  INITIAL = 'INITIAL',
  CAMERA_REQUEST = 'CAMERA_REQUEST',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  VIEWING_RESULT = 'VIEWING_RESULT',
  ERROR = 'ERROR'
}
