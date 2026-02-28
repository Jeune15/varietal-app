import { ShotState } from "./types"
import { presets, PresetType } from "./presets"
import { isVictory } from "./victory"

export function generatePresetCase(type: PresetType): ShotState {
  const preset = presets.find(p => p.type === type)

  if (!preset) {
    throw new Error("Preset no encontrado")
  }

  if (isVictory(preset.initialState)) {
    throw new Error("El preset no puede iniciar equilibrado")
  }

  return { ...preset.initialState }
}

export function generateRandomPresetCase(): ShotState {
  const randomIndex = Math.floor(Math.random() * presets.length)
  const preset = presets[randomIndex]

  return { ...preset.initialState }
}