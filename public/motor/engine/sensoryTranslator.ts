import { ShotState } from "./types"

export function describeShot(state: ShotState): string {
  const notes: string[] = []

  // Extracción
  if (state.extraction <= -2) {
    notes.push("Acidez punzante", "Poco dulzor", "Final corto")
  } else if (state.extraction === -1) {
    notes.push("Acidez marcada", "Dulzor bajo")
  } else if (state.extraction === 0) {
    notes.push("Buen balance entre acidez y dulzor")
  } else if (state.extraction === 1) {
    notes.push("Ligero amargor", "Final más largo")
  } else if (state.extraction >= 2) {
    notes.push("Amargor dominante", "Astringencia")
  }

  // Intensidad
  if (state.intensity <= -1) {
    notes.push("Cuerpo ligero")
  } else if (state.intensity >= 1) {
    notes.push("Cuerpo alto")
  }

  // Balance
  if (state.balance <= -1) {
    notes.push("Perfil desbalanceado")
  }

  return notes.join(", ") + "."
}