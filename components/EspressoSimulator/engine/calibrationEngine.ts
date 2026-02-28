import { ShotState, Adjustment, Level } from "./types"
import { impactMatrix } from "./impactMatrix"

export function applyAdjustment(
  state: ShotState,
  adjustment: Adjustment
): ShotState {
  const impact = impactMatrix[adjustment]

  return {
    extraction: state.extraction + impact.extraction,
    intensity: state.intensity + impact.intensity,
    balance: state.balance + impact.balance,
  }
}
