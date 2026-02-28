import { ShotState } from "./types"

export type PresetType =
  | "underExtraction"
  | "overExtraction"
  | "ratioError"
  | "temperatureError"
  | "complexImbalance"

export interface Preset {
  type: PresetType
  label: string
  pedagogicalGoal: string
  difficulty: "basic" | "intermediate" | "advanced"
  initialState: ShotState
}

export const presets: Preset[] = [
  {
    type: "underExtraction",
    label: "Subextracción clásica",
    pedagogicalGoal:
      "Identificar falta de extracción y corregir con molienda o ratio.",
    difficulty: "basic",
    initialState: {
      extraction: -2,
      intensity: -1,
      balance: -1,
    },
  },
  {
    type: "overExtraction",
    label: "Sobreextracción clásica",
    pedagogicalGoal:
      "Detectar amargor y astringencia por exceso de extracción.",
    difficulty: "basic",
    initialState: {
      extraction: 2,
      intensity: 1,
      balance: -1,
    },
  },
  {
    type: "ratioError",
    label: "Ratio mal configurado",
    pedagogicalGoal:
      "Diferenciar extracción de concentración.",
    difficulty: "intermediate",
    initialState: {
      extraction: 0,
      intensity: -2,
      balance: -1,
    },
  },
  {
    type: "temperatureError",
    label: "Error de temperatura",
    pedagogicalGoal:
      "Entender impacto térmico en balance.",
    difficulty: "intermediate",
    initialState: {
      extraction: -1,
      intensity: 0,
      balance: -2,
    },
  },
  {
    type: "complexImbalance",
    label: "Desbalance complejo",
    pedagogicalGoal:
      "Resolver múltiples variables estratégicamente.",
    difficulty: "advanced",
    initialState: {
      extraction: 2,
      intensity: -1,
      balance: -2,
    },
  },
]