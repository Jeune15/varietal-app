import { ShotState, Difficulty } from "./types"
import { isVictory } from "./victory"
import { presets, SimulationPreset } from "./presets"

function randomLevel(): -2 | -1 | 0 | 1 | 2 {
  const values = [-2, -1, 0, 1, 2] as const
  return values[Math.floor(Math.random() * values.length)]
}

function isTooCloseToBalanced(state: ShotState): boolean {
  // Evita estados demasiado fáciles como:
  // extraction = 0 pero intensity/balance apenas fuera
  const distanceFromIdeal =
    Math.abs(state.extraction) +
    Math.abs(state.intensity) +
    Math.abs(state.balance)

  return distanceFromIdeal <= 1
}

export function generateRandomCase(difficulty: Difficulty = "basic"): ShotState {
  let state: ShotState

  do {
    state = {
      extraction: randomLevel(),
      intensity: randomLevel(),
      balance: randomLevel(),
    }
  } while (isVictory(state) || isTooCloseToBalanced(state))

  return state
}

export function generatePresetCase(presetId: string): ShotState {
  const preset = presets.find((p) => p.id === presetId)
  if (!preset) {
    console.warn(`Preset ${presetId} not found, falling back to random.`)
    return generateRandomCase()
  }
  return { ...preset.initialState }
}
