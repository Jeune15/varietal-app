import { Adjustment } from "./types"

export const impactMatrix: Record<
  Adjustment,
  { extraction: number; intensity: number; balance: number }
> = {
  finerGrind: {
    extraction: 1,
    intensity: 1,
    balance: 0,
  },
  coarserGrind: {
    extraction: -1,
    intensity: -1,
    balance: 0,
  },
  higherRatio: {
    extraction: 1,
    intensity: -1,
    balance: 0,
  },
  lowerRatio: {
    extraction: -1,
    intensity: 1,
    balance: 0,
  },
  higherTemp: {
    extraction: 1,
    intensity: 0,
    balance: -1,
  },
  lowerTemp: {
    extraction: -1,
    intensity: 0,
    balance: 1,
  },
}