import { describe, expect, it } from 'vitest'
import { render } from '@solidjs/testing-library'
import { createEffect, createSignal } from 'solid-js'
import { ThemeContext, useTheme } from '../../contexts'

type Theme = ReturnType<ReturnType<typeof useTheme>>

function renderThemeProbe(provider?: () => Theme) {
  let resolvedTheme: Theme | undefined
  function ThemeProbe() {
    const theme = useTheme()
    resolvedTheme = theme()
    return null
  }

  render(() =>
    provider ? (
      <ThemeContext.Provider value={provider}>
        <ThemeProbe />
      </ThemeContext.Provider>
    ) : (
      <ThemeProbe />
    ),
  )

  return resolvedTheme
}

describe('ThemeContext', () => {
  describe('default value', () => {
    it('should resolve to "dark" when no "ThemeContext.Provider" wraps the consumer', () => {
      expect(renderThemeProbe()).toBe('dark')
    })
  })

  describe('with a "ThemeContext.Provider"', () => {
    it('should resolve to the value provided by the "Provider"', () => {
      expect(renderThemeProbe(() => 'light')).toBe('light')
      expect(renderThemeProbe(() => 'dark')).toBe('dark')
    })

    it('should reflect updates when the "Provider" value is a reactive "Accessor"', () => {
      const [theme, setTheme] = createSignal<Theme>('dark')
      let observed: Theme | undefined
      function ThemeProbe() {
        const resolved = useTheme()
        createEffect(() => {
          observed = resolved()
        })
        return null
      }

      render(() => (
        <ThemeContext.Provider value={theme}>
          <ThemeProbe />
        </ThemeContext.Provider>
      ))

      expect(observed).toBe('dark')

      setTheme('light')
      expect(observed).toBe('light')
    })
  })
})
