export type Level = -2 | -1 | 0 | 1 | 2

export interface ShotState {
  extraction: Level
  intensity: Level
  balance: Level
}

export type Adjustment =
  | "finerGrind"
  | "coarserGrind"
  | "higherRatio"
  | "lowerRatio"
  | "higherTemp"
  | "lowerTemp"