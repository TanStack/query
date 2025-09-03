import { createContext, useContext } from 'solid-js'
import type { Accessor } from 'solid-js'

export const ThemeContext = createContext<Accessor<'light' | 'dark'>>(
  () => 'dark' as const,
)

export function useTheme() {
  return useContext(ThemeContext)
}
