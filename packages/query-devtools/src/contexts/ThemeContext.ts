import { createContext, useContext } from 'solid-js'
import type { Accessor } from 'solid-js'

export const ThemeContext = createContext<Accessor<'light' | 'dark'>>(
  () => 'dark' as const,
)

/**
 * Returns the devtools theme from context.
 * @returns A getter for the current theme, `'light'` or `'dark'`. Defaults to `'dark'`.
 */
export function useTheme() {
  return useContext(ThemeContext)
}
