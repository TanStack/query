import { QueryClient, onlineManager } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TanstackQueryDevtoolsPanel } from '..'

// `solid-transition-group` resolves to its unpublished source under Vite.
vi.mock(import('solid-transition-group'), () => ({
  TransitionGroup: (props) => props.children,
}))

describe('TanstackQueryDevtoolsPanel', () => {
  let devtools: TanstackQueryDevtoolsPanel

  beforeEach(() => {
    devtools = new TanstackQueryDevtoolsPanel({
      client: new QueryClient(),
      queryFlavor: 'TanStack Query',
      version: '5',
      onlineManager,
    })
  })

  describe('mount', () => {
    it('should mount devtools to the provided element', () => {
      const el = document.createElement('div')

      expect(() => devtools.mount(el)).not.toThrow()

      devtools.unmount()
    })

    it('should throw if mount is called twice without unmount', () => {
      const el = document.createElement('div')
      devtools.mount(el)

      expect(() => devtools.mount(el)).toThrow('Devtools is already mounted')

      devtools.unmount()
    })
  })

  describe('unmount', () => {
    it('should unmount devtools and allow remounting', () => {
      const el = document.createElement('div')
      devtools.mount(el)

      expect(() => devtools.unmount()).not.toThrow()
      expect(() => devtools.mount(el)).not.toThrow()

      devtools.unmount()
    })

    it('should throw if unmount is called before mount', () => {
      expect(() => devtools.unmount()).toThrow('Devtools is not mounted')
    })

    it('should throw if unmount is called twice', () => {
      const el = document.createElement('div')
      devtools.mount(el)
      devtools.unmount()

      expect(() => devtools.unmount()).toThrow('Devtools is not mounted')
    })
  })

  describe('setters', () => {
    describe('before mount', () => {
      it('should not throw when "setButtonPosition" is called', () => {
        expect(() => devtools.setButtonPosition('top-left')).not.toThrow()
      })

      it('should not throw when "setPosition" is called', () => {
        expect(() => devtools.setPosition('left')).not.toThrow()
      })

      it('should not throw when "setInitialIsOpen" is called', () => {
        expect(() => devtools.setInitialIsOpen(true)).not.toThrow()
      })

      it('should not throw when "setErrorTypes" is called', () => {
        expect(() =>
          devtools.setErrorTypes([
            { name: 'NetworkError', initializer: () => new Error('Network') },
          ]),
        ).not.toThrow()
      })

      it('should not throw when "setClient" is called', () => {
        expect(() => devtools.setClient(new QueryClient())).not.toThrow()
      })

      it('should not throw when "setOnClose" is called', () => {
        expect(() => devtools.setOnClose(() => {})).not.toThrow()
      })

      it('should not throw when "setTheme" is called', () => {
        expect(() => devtools.setTheme('dark')).not.toThrow()
        expect(() => devtools.setTheme('light')).not.toThrow()
        expect(() => devtools.setTheme('system')).not.toThrow()
        expect(() => devtools.setTheme(undefined)).not.toThrow()
      })
    })

    describe('after mount', () => {
      it('should not throw when setters are called on a mounted instance', () => {
        const el = document.createElement('div')
        devtools.mount(el)

        try {
          expect(() => devtools.setButtonPosition('top-left')).not.toThrow()
          expect(() => devtools.setPosition('left')).not.toThrow()
          expect(() => devtools.setInitialIsOpen(true)).not.toThrow()
          expect(() =>
            devtools.setErrorTypes([
              { name: 'NetworkError', initializer: () => new Error('Network') },
            ]),
          ).not.toThrow()
          expect(() => devtools.setClient(new QueryClient())).not.toThrow()
          expect(() => devtools.setOnClose(() => {})).not.toThrow()
          expect(() => devtools.setTheme('dark')).not.toThrow()
        } finally {
          devtools.unmount()
        }
      })
    })
  })

  describe('styles', () => {
    it('should add the styles to the shadow root the panel renders in', async () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
          removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
        })),
      )
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe() {}
          unobserve() {}
          disconnect() {}
        },
      )
      const host = document.createElement('div')
      document.body.appendChild(host)
      const shadowRoot = host.attachShadow({ mode: 'open' })
      const el = document.createElement('div')
      shadowRoot.appendChild(el)
      devtools.mount(el)

      try {
        await vi.waitFor(
          () =>
            expect(shadowRoot.querySelector('.tsqd-main-panel')).not.toBeNull(),
          5000,
        )
        expect(shadowRoot.adoptedStyleSheets).toHaveLength(1)
      } finally {
        devtools.unmount()
        host.remove()
      }
    })
  })
})
