import { ShotState } from "./types"

export function getAdvice(state: ShotState): string {
  const suggestions: string[] = []

  // 1. Prioritize Extraction issues (most critical)
  if (state.extraction <= -1) {
    suggestions.push("Tu café está sub-extraído (ácido/rápido). Necesitas aumentar el tiempo de contacto o la temperatura.")
    suggestions.push("Sugerencia: Prueba molienda más fina, aumenta la preinfusión, o sube la temperatura.")
  } else if (state.extraction >= 1) {
    suggestions.push("Tu café está sobre-extraído (amargo/lento). Necesitas reducir la extracción.")
    suggestions.push("Sugerencia: Prueba molienda más gruesa, reduce la preinfusión, o baja la temperatura.")
  }

  // 2. Check Intensity (Body/Strength) if Extraction is roughly ok
  if (Math.abs(state.extraction) <= 1) {
    if (state.intensity <= -2) {
      suggestions.push("El cuerpo es muy débil. Intenta aumentar la dosis o usa menos agua (ratio más corto).")
    } else if (state.intensity >= 2) {
      suggestions.push("Es demasiado intenso/fuerte. Prueba un ratio más largo (más agua) o reduce la dosis.")
    }
  }

  // 3. Balance Check
  if (Math.abs(state.extraction) <= 1 && Math.abs(state.intensity) <= 1) {
      if (state.balance !== 0) {
           suggestions.push("Estás muy cerca. Pequeños ajustes de temperatura pueden afinar el balance final.")
      }
  }

  if (suggestions.length === 0) {
      return "¡Vas por buen camino! Haz ajustes finos si lo deseas."
  }

  return suggestions[0] // Return the most critical advice
}
