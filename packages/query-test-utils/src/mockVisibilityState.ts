import { vi } from 'vitest'
import type { MockInstance } from 'vitest'

export const mockVisibilityState = (
  value: DocumentVisibilityState,
): MockInstance<() => DocumentVisibilityState> =>
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
