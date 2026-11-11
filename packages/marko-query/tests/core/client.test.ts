import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dehydrate, environmentManager, onlineManager } from '@tanstack/query-core'
import {
  getQueryClient,
  isRestoring,
  setIsRestoring,
  setQueryClient,
  setQueryClientFactory,
} from '../../src/core/index.js'
import {
  onPageClientChange,
  onRestoringChange,
  registerQueryClientFactory,
} from '../../src/core/internal.js'
import { hydrateOnce, unregisterQueryClientFactory } from '../../src/core/client.js'
import { createClient, resetShared, setServer } from './utils.js'
import type { DehydratedState, MutationKey, QueryClient } from '@tanstack/query-core'

/**
 * A dehydrated state holding paused mutations, made the way the server makes
 * one: the mutations are submitted while the client is offline, so core's
 * default `shouldDehydrateMutation` keeps them.
 */
async function pausedState(
  variables: Array<number> = [1],
  mutationKey: MutationKey | undefined = ['m'],
): Promise<DehydratedState> {
  onlineManager.setOnline(false)
  const source = createClient()
  const mutations = variables.map((value) => {
    const mutation = source.getMutationCache().build(source, {
      mutationKey,
      mutationFn: () => Promise.resolve('ok'),
    })
    void mutation.execute(value)
    return mutation
  })
  // `execute` is async, so wait for the pause instead of guessing a tick count.
  await vi.waitFor(() => {
    for (const mutation of mutations) expect(mutation.state.isPaused).toBe(true)
  })
  const state = dehydrate(source)
  onlineManager.setOnline(true)
  return state
}

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

    it('setQueryClient hydrates $global into the client the page already uses', async () => {
      setServer(true)
      const server = createClient()
      await server.query({ queryKey: ['x'], queryFn: () => 'server' })
      const global = { dehydratedQueryState: dehydrate(server) }
      setServer(false)

      // The page client is created without `$global`, so nothing is hydrated.
      const client = getQueryClient()
      expect(client.getQueryData(['x'])).toBeUndefined()

      setQueryClient(client, global)
      expect(getQueryClient()).toBe(client)
      expect(client.getQueryData(['x'])).toBe('server')
      expect((client as unknown as { mounts: number }).mounts).toBe(1)
    })
  })

  describe('onPageClientChange', () => {
    beforeEach(() => setServer(false))

    it('notifies when setQueryClient replaces the page client', () => {
      const listener = vi.fn<() => void>()
      const unwatch = onPageClientChange(listener, () => true)

      setQueryClient(createClient())
      expect(listener).toHaveBeenCalledTimes(1)

      setQueryClient(createClient())
      expect(listener).toHaveBeenCalledTimes(2)

      unwatch()
      setQueryClient(createClient())
      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('does not notify when the client is the one the page already uses', () => {
      const client = getQueryClient()
      const listener = vi.fn<() => void>()
      onPageClientChange(listener, () => true)

      setQueryClient(client)
      expect(listener).not.toHaveBeenCalled()
    })

    it('does not notify a listener that does not follow the page client', () => {
      const listener = vi.fn<() => void>()
      onPageClientChange(listener, () => false)

      setQueryClient(createClient())
      expect(listener).not.toHaveBeenCalled()
    })

    it('does not notify on the server', () => {
      setServer(true)
      const listener = vi.fn<() => void>()
      onPageClientChange(listener, () => true)

      setQueryClient(createClient(), {})
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('hydrateOnce', () => {
    afterEach(() => onlineManager.setOnline(true))

    it('adds a paused mutation once, however often the state is hydrated', async () => {
      const state = await pausedState()
      const client = createClient()
      hydrateOnce(client, state)
      hydrateOnce(client, state)
      hydrateOnce(client, state)
      expect(client.getMutationCache().getAll()).toHaveLength(1)
    })

    it('recognizes the same mutation in a fresh dehydrate result', async () => {
      const state = await pausedState()
      const client = createClient()
      hydrateOnce(client, state)
      hydrateOnce(client, structuredClone(state))
      expect(client.getMutationCache().getAll()).toHaveLength(1)
    })

    it('keeps distinct paused mutations', async () => {
      const state = await pausedState([1, 2])
      expect(state.mutations).toHaveLength(2)
      const client = createClient()
      hydrateOnce(client, state)
      hydrateOnce(client, state)
      expect(client.getMutationCache().getAll()).toHaveLength(2)
    })

    it('keeps paused mutations that have no mutationKey', async () => {
      const state = await pausedState([1, 2], undefined)
      expect(state.mutations).toHaveLength(2)
      const client = createClient()
      hydrateOnce(client, state)
      expect(client.getMutationCache().getAll()).toHaveLength(2)
    })

    it('hydrates queries as core does', () => {
      const source = createClient()
      source.setQueryData(['q'], 'value')
      const state = dehydrate(source)
      const client = createClient()
      hydrateOnce(client, state)
      hydrateOnce(client, state)
      expect(client.getQueryData(['q'])).toBe('value')
    })

    it('is a no-op for a nullish state', () => {
      const client = createClient()
      hydrateOnce(client, null)
      hydrateOnce(client, undefined)
      expect(client.getMutationCache().getAll()).toHaveLength(0)
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
