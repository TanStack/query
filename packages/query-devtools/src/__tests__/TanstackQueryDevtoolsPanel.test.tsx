import { beforeEach, describe, expect, it } from 'vitest'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { TanstackQueryDevtoolsPanel } from '..'

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
})
