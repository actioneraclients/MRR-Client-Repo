export type NormalizedSection = {
  id: string
  type: string
  enabled: boolean
  content: Record<string, unknown>
  background_mode?: string
  background_color?: string
}

function flattenDeep<T>(arr: unknown[]): T[] {
  const result: T[] = []
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenDeep<T>(item as unknown[]))
    } else {
      result.push(item as T)
    }
  }
  return result
}

export function normalizeSections(input: unknown): NormalizedSection[] {
  if (!input || !Array.isArray(input)) {
    return []
  }

  const flat = flattenDeep<unknown>(input)

  return flat
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => {
      const type = typeof item.type === "string" ? item.type : "generic"
      const content = item.content && typeof item.content === "object" ? (item.content as Record<string, unknown>) : {}
      const makeId = () =>
        typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
          ? (crypto as any).randomUUID()
          : `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      return {
        id: typeof item.id === "string" ? item.id : makeId(),
        type,
        enabled: item.enabled !== false,
        content,
        background_mode: typeof item.background_mode === "string" ? item.background_mode : undefined,
        background_color: typeof item.background_color === "string" ? item.background_color : undefined,
      }
    })
}
