import { fireEvent } from '@solidjs/testing-library'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TanstackQueryDevtools } from '..'

// `solid-transition-group` resolves to its unpublished source under Vite.
vi.mock(import('solid-transition-group'), () => ({
  TransitionGroup: (props) => props.children,
}))

describe('TanstackQueryDevtools', () => {
  let devtools: TanstackQueryDevtools

  beforeEach(() => {
    devtools = new TanstackQueryDevtools({
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
          expect(() => devtools.setTheme('dark')).not.toThrow()
        } finally {
          devtools.unmount()
        }
      })
    })
  })

  describe('styles', () => {
    it('should style the settings menu outside the "shadowDOMTarget"', async () => {
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
      const shadowDevtools = new TanstackQueryDevtools({
        client: new QueryClient(),
        queryFlavor: 'TanStack Query',
        version: '5',
        onlineManager,
        shadowDOMTarget: shadowRoot,
        initialIsOpen: true,
      })
      shadowDevtools.mount(el)

      try {
        const settings = await vi.waitFor(() => {
          const button = shadowRoot.querySelector<HTMLElement>(
            '[aria-label="Open settings menu"]',
          )
          expect(button).not.toBeNull()
          return button!
        }, 5000)
        fireEvent.keyDown(settings, { key: 'Enter' })

        // The menu renders through a portal on `document.body`.
        expect(
          document.body.querySelector('.tsqd-settings-menu'),
        ).not.toBeNull()
        expect(document.adoptedStyleSheets).toHaveLength(1)
      } finally {
        shadowDevtools.unmount()
        host.remove()
      }
    })
  })

  describe('trustedTypesPolicy', () => {
    it('should create the devtools markup with the policy', async () => {
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
      // Solid creates each template once, so use a fresh copy of the devtools.
      vi.resetModules()
      const { TanstackQueryDevtools: FreshTanstackQueryDevtools } =
        await import('..')
      const createHTML = vi.fn<(html: string) => string>((html) => html)
      const policyDevtools = new FreshTanstackQueryDevtools({
        client: new QueryClient(),
        queryFlavor: 'TanStack Query',
        version: '5',
        onlineManager,
        trustedTypesPolicy: { createHTML },
      })
      const el = document.createElement('div')
      document.body.appendChild(el)
      policyDevtools.mount(el)

      try {
        await vi.waitFor(
          () => expect(el.querySelector('.tsqd-open-btn')).not.toBeNull(),
          5000,
        )
        expect(createHTML).toHaveBeenCalledWith(expect.stringContaining('<'))
      } finally {
        policyDevtools.unmount()
        el.remove()
      }
    })
  })
})
