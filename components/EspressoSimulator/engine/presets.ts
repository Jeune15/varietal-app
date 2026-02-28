import { ShotState } from "./types"

export type Difficulty = "easy" | "medium" | "hard"

export interface SimulationPreset {
  id: string
  label: string
  description: string
  difficulty: Difficulty
  initialState: ShotState
  targetGoal: string
  hints: string[]
}

export const presets: SimulationPreset[] = [
  {
    id: "sub-extracted-sour",
    label: "El golpe ácido",
    description: "Un shot rápido y agresivamente ácido. Falta cuerpo y dulzor.",
    difficulty: "easy",
    initialState: {
      extraction: -2,
      intensity: -1,
      balance: -1,
    },
    targetGoal: "Equilibrar la acidez aumentando la extracción.",
    hints: [
      "Si está ácido y rápido, necesitas restringir el flujo.",
      "Prueba una molienda más fina para aumentar el tiempo de contacto.",
    ],
  },
  {
    id: "over-extracted-bitter",
    label: "Amargor seco",
    description: "Un shot lento, goteando, con un final seco y astringente.",
    difficulty: "easy",
    initialState: {
      extraction: 2,
      intensity: 1,
      balance: -1,
    },
    targetGoal: "Reducir la sobre-extracción para eliminar el amargor.",
    hints: [
      "El agua está pasando demasiado lento.",
      "Libera el flujo con una molienda más gruesa.",
    ],
  },
  {
    id: "weak-body",
    label: "Cuerpo débil",
    description: "El sabor es correcto pero se siente aguado y sin textura.",
    difficulty: "medium",
    initialState: {
      extraction: 0,
      intensity: -2,
      balance: 0,
    },
    targetGoal: "Aumentar la intensidad sin arruinar el balance.",
    hints: [
      "Si el sabor es bueno pero débil, aumenta la dosis o reduce el ratio.",
      "Cuidado: al cambiar la dosis, también cambiarás la extracción.",
    ],
  },
  {
    id: "channeling-chaos",
    label: "Caos de canalización",
    description: "Mezcla confusa de agrio y amargo. Extracción desigual.",
    difficulty: "hard",
    initialState: {
      extraction: -1,
      intensity: 0,
      balance: -2,
    },
    targetGoal: "Estabilizar la extracción y mejorar el balance.",
    hints: [
      "La canalización a menudo se siente como ambos defectos a la vez.",
      "Mejora la distribución o ajusta la molienda para ser más uniforme.",
    ],
  },
  {
    id: "temperature-low",
    label: "Frialdad ácida",
    description: "Acidez punzante pero el flujo parece correcto visualmente.",
    difficulty: "medium",
    initialState: {
      extraction: -1,
      intensity: 0,
      balance: 1,
    },
    targetGoal: "Aumentar la extracción usando temperatura.",
    hints: [
      "Si la molienda y el tiempo parecen bien, revisa la temperatura.",
      "El agua más caliente extrae más rápido y reduce la acidez.",
    ],
  },
]
