import { ShotState } from "./types"

export function isVictory(state: ShotState): boolean {
  return (
    state.extraction === 0 &&
    state.intensity >= -1 &&
    state.intensity <= 1 &&
    state.balance >= -1 &&
    state.balance <= 1
  )
}
