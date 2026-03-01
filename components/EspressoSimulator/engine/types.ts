export type Level = number
export type Difficulty = "basic" | "advanced"

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
  | "higherDose"
  | "lowerDose"
  | "longerPreinfusion"
  | "shorterPreinfusion"
