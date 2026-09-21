import { describe, expect, it } from 'vitest'
import { render } from '@solidjs/testing-library'
import { createEffect, createSignal } from 'solid-js'
import { ThemeContext, useTheme } from '../../contexts'

type Theme = ReturnType<ReturnType<typeof useTheme>>

describe('ThemeContext', () => {
  describe('default value', () => {
    it('should resolve to "dark" when no "ThemeContext.Provider" wraps the consumer', () => {
      let resolvedTheme: Theme | undefined
      function ThemeProbe() {
        const theme = useTheme()
        resolvedTheme = theme()
        return null
      }

      render(() => <ThemeProbe />)

      expect(resolvedTheme).toBe('dark')
    })
  })

  describe('with a "ThemeContext.Provider"', () => {
    it('should reflect updates when the "Provider" value is a reactive "Accessor"', () => {
      const [theme, setTheme] = createSignal<Theme>('dark')
      const observed: Array<Theme> = []
      function ThemeProbe() {
        const resolved = useTheme()
        createEffect(() => {
          observed.push(resolved())
        })
        return null
      }

      render(() => (
        <ThemeContext.Provider value={theme}>
          <ThemeProbe />
        </ThemeContext.Provider>
      ))

      expect(observed).toEqual(['dark'])

      setTheme('light')
      expect(observed).toEqual(['dark', 'light'])
    })
  })
})
