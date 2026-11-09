import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dehydrate, environmentManager } from '@tanstack/query-core'
import {
  getQueryClient,
  isRestoring,
  setIsRestoring,
  setQueryClient,
  setQueryClientFactory,
} from '../../src/core/index.js'
import {
  onRestoringChange,
  registerQueryClientFactory,
} from '../../src/core/internal.js'
import { unregisterQueryClientFactory } from '../../src/core/client.js'
import { createClient, resetShared, setServer } from './utils.js'
import type { QueryClient } from '@tanstack/query-core'

describe('query client', () => {
  beforeEach(() => {
    resetShared()
    setQueryClientFactory(createClient)
  })

  afterEach(() => setServer(true))

  describe('server', () => {
    beforeEach(() => setServer(true))

    it('one client per $global, never shared', () => {
      const a = {}
      const b = {}
      expect(getQueryClient(a)).toBe(getQueryClient(a))
      expect(getQueryClient(a)).not.toBe(getQueryClient(b))
    })

    it('a spread of the context reuses the client', () => {
      const ctx = {}
      const client = getQueryClient(ctx)
      expect(getQueryClient({ ...ctx })).toBe(client)
    })

    it('the request cache is exposed as a serialized global, dehydrated on read', async () => {
      const ctx: Record<string, unknown> = { serializedGlobals: { url: true } }
      const client = getQueryClient(ctx)
      expect(ctx.serializedGlobals).toStrictEqual({
        url: true,
        dehydratedQueryState: true,
      })
      await client.query({ queryKey: ['a'], queryFn: () => 1 })
      expect(ctx.dehydratedQueryState).toMatchObject({
        queries: [{ queryHash: '["a"]', state: { data: 1 } }],
      })
    })

    it('the array form of serializedGlobals is kept an array', () => {
      const ctx: Record<string, unknown> = { serializedGlobals: ['url'] }
      getQueryClient(ctx)
      expect(ctx.serializedGlobals).toStrictEqual([
        'url',
        'dehydratedQueryState',
      ])
    })

    it('a spread copy dehydrates again when read later', async () => {
      const ctx: Record<string, unknown> = {}
      const client = getQueryClient(ctx)
      const copy: Record<string, unknown> = { ...ctx }
      await client.query({ queryKey: ['late'], queryFn: () => 2 })
      getQueryClient(copy)
      expect(
        (copy.dehydratedQueryState as ReturnType<typeof dehydrate>).queries,
      ).toHaveLength(1)
    })

    it('the factory creates every client', () => {
      const created: Array<QueryClient> = []
      setQueryClientFactory(() => {
        const client = createClient()
        created.push(client)
        return client
      })
      const client = getQueryClient({})
      expect(created).toStrictEqual([client])
    })

    it('setQueryClient attaches a client to the request', () => {
      const ctx = {}
      const client = createClient()
      setQueryClient(client, ctx)
      expect(getQueryClient(ctx)).toBe(client)
      expect(() => setQueryClient(client)).toThrow(/\$global/)
    })

    it('getQueryClient needs $global', () => {
      expect(() => getQueryClient()).toThrow(/\$global/)
    })

    it('warns when a server client is made before the factory is registered', () => {
      unregisterQueryClientFactory()
      const warnings: Array<string> = []
      const warn = console.warn
      console.warn = (message: string) => warnings.push(message)
      try {
        getQueryClient({})
        expect(warnings.join('\n')).toContain('default factory')
        getQueryClient({ another: true }) // warned once per process
        expect(warnings).toHaveLength(1)
        setQueryClientFactory(() => createClient())
        getQueryClient({ different: true })
        expect(warnings).toHaveLength(1)
      } finally {
        console.warn = warn
      }
    })
  })

  describe('browser', () => {
    beforeEach(() => setServer(false))

    it('one client per page, mounted once', () => {
      const client = getQueryClient()
      expect(getQueryClient({})).toBe(client)
      expect((client as unknown as { mounts: number }).mounts).toBe(1)
    })

    it('hydrates each distinct $global state once', async () => {
      setServer(true)
      const server = createClient()
      await server.query({ queryKey: ['x'], queryFn: () => 'server' })
      const first = { dehydratedQueryState: dehydrate(server) }
      await server.query({ queryKey: ['y'], queryFn: () => 'second' })
      const second = { dehydratedQueryState: dehydrate(server) }
      setServer(false)

      const client = getQueryClient(first)
      expect(client.getQueryData(['x'])).toBe('server')
      client.setQueryData(['x'], 'edited')
      getQueryClient(first)
      expect(client.getQueryData(['x'])).toBe('edited')
      getQueryClient(second)
      expect(client.getQueryData(['y'])).toBe('second')
    })

    it('setQueryClient replaces the page client', () => {
      const previous = getQueryClient()
      const next = createClient()
      setQueryClient(next)
      expect(getQueryClient()).toBe(next)
      expect((previous as unknown as { mounts: number }).mounts).toBe(0)
      expect((next as unknown as { mounts: number }).mounts).toBe(1)
    })
  })

  describe('registerQueryClientFactory', () => {
    it('server: registers before the first client', () => {
      setServer(true)
      const made: Array<QueryClient> = []
      registerQueryClientFactory(() => {
        const client = createClient()
        made.push(client)
        return client
      }, {})
      const ctx = {}
      expect(getQueryClient(ctx)).toBe(made[0])
    })

    it('server: throws when a client for this $global already exists', () => {
      setServer(true)
      const ctx = {}
      getQueryClient(ctx)
      expect(() =>
        registerQueryClientFactory(() => createClient(), ctx),
      ).toThrow(/root layout/)
    })

    it('server: needs $global', () => {
      setServer(true)
      expect(() => registerQueryClientFactory(() => createClient())).toThrow(
        /\$global/,
      )
    })

    it('browser: warns but keeps the page client when one already exists', () => {
      setServer(false)
      unregisterQueryClientFactory()
      const page = getQueryClient()
      expect(page.getDefaultOptions().queries?.staleTime).toBeUndefined()
      const warnings: Array<string> = []
      const warn = console.warn
      console.warn = (message: string) => warnings.push(message)
      try {
        const made: Array<QueryClient> = []
        const factory = () => {
          const client = createClient()
          made.push(client)
          return client
        }
        expect(() => registerQueryClientFactory(factory)).not.toThrow()
        expect(getQueryClient()).toBe(page)
        expect(warnings.join('\n')).toContain('created later')
        // The factory is adopted: the next client the page makes uses it.
        resetShared()
        expect(made).toStrictEqual([getQueryClient()])
      } finally {
        console.warn = warn
      }
    })

    it('browser: stays silent when the page client came from a factory', () => {
      setServer(false)
      const first = () => createClient()
      registerQueryClientFactory(first)
      const page = getQueryClient()
      const warnings: Array<string> = []
      const warn = console.warn
      console.warn = (message: string) => warnings.push(message)
      try {
        // Evaluating another template registers the same kind of factory again.
        registerQueryClientFactory(() => createClient())
        expect(warnings).toStrictEqual([])
        expect(getQueryClient()).toBe(page)
      } finally {
        console.warn = warn
      }
    })

    it('registering the same factory again is a no-op, even later', () => {
      setServer(false)
      const factory = () => createClient()
      registerQueryClientFactory(factory)
      const client = getQueryClient()
      expect(() => registerQueryClientFactory(factory)).not.toThrow()
      expect(getQueryClient()).toBe(client)
    })

    it('rejects a non-function', () => {
      expect(() => registerQueryClientFactory(undefined as never, {})).toThrow(
        /factory/,
      )
    })
  })

  it('isRestoring is per client and notifies', () => {
    const client = createClient()
    const calls: Array<boolean> = []
    onRestoringChange(client, () => calls.push(isRestoring(client)))
    expect(isRestoring(client)).toBe(false)
    setIsRestoring(client, true)
    setIsRestoring(client, true)
    setIsRestoring(client, false)
    expect(calls).toStrictEqual([true, false])
    expect(environmentManager.isServer()).toBe(true)
  })
})
