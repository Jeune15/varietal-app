import { ShotState, Adjustment, Level } from "./types"
import { impactMatrix } from "./impactMatrix"

function clamp(value: number): Level {
  if (value > 2) return 2
  if (value < -2) return -2
  return value as Level
}

export function applyAdjustment(
  state: ShotState,
  adjustment: Adjustment
): ShotState {
  const impact = impactMatrix[adjustment]

  return {
    extraction: clamp(state.extraction + impact.extraction),
    intensity: clamp(state.intensity + impact.intensity),
    balance: clamp(state.balance + impact.balance),
  }
}