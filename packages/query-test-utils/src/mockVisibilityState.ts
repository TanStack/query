import { vi } from 'vitest'
import type { MockInstance } from 'vitest'

/**
 * Mocks `document.visibilityState` to return a given value.
 * @param value - The visibility state to return.
 * @returns The spy, to restore the original getter with `mockRestore()`.
 */
export const mockVisibilityState = (
  value: DocumentVisibilityState,
): MockInstance<() => DocumentVisibilityState> =>
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
