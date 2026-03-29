export type Unit = 'inches' | 'feet' | 'cm' | 'meters';

export interface Point {
  x: number;
  y: number;
}

export interface Measurement {
  id: string;
  p1: Point;
  p2: Point;
  pixelDistance: number;
  realDistance: number;
  unit: Unit;
  label?: string;
  isReference?: boolean;
}

export interface AppState {
  image: string | null;
  scale: number | null; // pixels per unit
  unit: Unit;
  measurements: Measurement[];
  mode: 'calibrate' | 'measure' | 'pan';
  zoom: number;
  pan: Point;
}
