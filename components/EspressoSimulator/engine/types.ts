export type Level = number

export interface ShotState {
  extraction: number
  intensity: number
  balance: number
}

export type Adjustment =
  | "finerGrind"
  | "coarserGrind"
  | "higherRatio"
  | "lowerRatio"
  | "higherTemp"
  | "lowerTemp"
