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
})
