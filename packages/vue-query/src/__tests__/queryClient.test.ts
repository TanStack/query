import * as core from '@tanstack/query-core'
import {
  getMutationCache,
  getQueryCache,
  select as querySelect,
  skipToken,
} from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, unref } from 'vue'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { MutationCache } from '../mutationCache'
import { QueryCache } from '../queryCache'
import {
  QueryClient,
  cancelQueries,
  countFetchingQueries,
  getMutationDefaults,
  getQueriesData,
  getQueryData,
  getQueryDefaults,
  getQueryState,
  infiniteQuery,
  isMutating,
  query,
  invalidateQueries as queryInvalidateQueries,
  refetchQueries as queryRefetchQueries,
  removeQueries,
  resetQueries,
  setDefaultOptions,
  setMutationDefaults,
  setQueriesData,
  setQueryData,
  setQueryDefaults,
} from '../queryClient'
import { queryOptions } from '../queryOptions'

const queryKeyRef = ['foo', ref('bar')]
const queryKeyUnref = ['foo', 'bar']

const fn = () => 'mock'

describe('QueryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    for (const operation of [
      'countFetchingQueries',
      'isMutating',
      'getQueryData',
      'getQueriesData',
      'setQueryData',
      'setQueriesData',
      'getQueryState',
      'removeQueries',
      'resetQueries',
      'cancelQueries',
      'invalidateQueries',
      'refetchQueries',
      'query',
      'infiniteQuery',
      'setDefaultOptions',
      'setQueryDefaults',
      'getQueryDefaults',
      'setMutationDefaults',
      'getMutationDefaults',
    ] as const)
      vi.spyOn(core, operation)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should use the queryCache and mutationCache passed in the config', () => {
      const queryCache = new QueryCache()
      const mutationCache = new MutationCache()
      const queryClient = new QueryClient({ queryCache, mutationCache })

      expect(getQueryCache(queryClient)).toBe(queryCache)
      expect(getMutationCache(queryClient)).toBe(mutationCache)
    })
  })

  describe('isFetching', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      countFetchingQueries(queryClient, {
        queryKey: queryKeyRef,
      })

      expect(core.countFetchingQueries).toHaveBeenCalledWith(queryClient, {
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('isMutating', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      isMutating(queryClient, {
        mutationKey: queryKeyRef,
      })

      expect(core.isMutating).toHaveBeenCalledWith(queryClient, {
        mutationKey: queryKeyUnref,
      })
    })
  })

  describe('getQueryData', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      getQueryData(queryClient, queryKeyRef)

      expect(core.getQueryData).toHaveBeenCalledWith(queryClient, queryKeyUnref)
    })
  })

  describe('getQueriesData', () => {
    it('should properly unwrap queryKey param', () => {
      const queryClient = new QueryClient()

      getQueriesData(queryClient, { queryKey: queryKeyRef })

      expect(core.getQueriesData).toHaveBeenCalledWith(queryClient, {
        queryKey: queryKeyUnref,
      })
    })

    it('should properly unwrap filters param', () => {
      const queryClient = new QueryClient()

      getQueriesData(queryClient, { queryKey: queryKeyRef })

      expect(core.getQueriesData).toHaveBeenCalledWith(queryClient, {
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('setQueryData', () => {
    it('should properly unwrap 3 parameter', () => {
      const queryClient = new QueryClient()

      setQueryData(queryClient, queryKeyRef, fn, {
        updatedAt: ref(3),
      })

      expect(core.setQueryData).toHaveBeenCalledWith(
        queryClient,
        queryKeyUnref,
        fn,
        { updatedAt: 3 },
      )
    })
  })

  describe('setQueriesData', () => {
    it('should properly unwrap params with queryKey', () => {
      const queryClient = new QueryClient()

      setQueriesData(queryClient, { queryKey: queryKeyRef }, fn, {
        updatedAt: ref(3),
      })

      expect(core.setQueriesData).toHaveBeenCalledWith(
        queryClient,
        { queryKey: queryKeyUnref },
        fn,
        { updatedAt: 3 },
      )
    })

    it('should properly unwrap params with filters', () => {
      const queryClient = new QueryClient()

      setQueriesData(queryClient, { queryKey: queryKeyRef }, fn, {
        updatedAt: ref(3),
      })

      expect(core.setQueriesData).toHaveBeenCalledWith(
        queryClient,
        { queryKey: queryKeyUnref },
        fn,
        { updatedAt: 3 },
      )
    })
  })

  describe('getQueryState', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      getQueryState(queryClient, queryKeyRef)

      expect(core.getQueryState).toHaveBeenCalledWith(
        queryClient,
        queryKeyUnref,
      )
    })
  })

  describe('removeQueries', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      removeQueries(queryClient, {
        queryKey: queryKeyRef,
      })

      expect(core.removeQueries).toHaveBeenCalledWith(queryClient, {
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('resetQueries', () => {
    it('should properly unwrap 2 parameter', () => {
      const queryClient = new QueryClient()

      resetQueries(
        queryClient,
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(core.resetQueries).toHaveBeenCalledWith(
        queryClient,
        {
          queryKey: queryKeyUnref,
        },
        { cancelRefetch: false },
      )
    })
  })

  describe('cancelQueries', () => {
    it('should properly unwrap 2 parameter', () => {
      const queryClient = new QueryClient()

      cancelQueries(
        queryClient,
        {
          queryKey: queryKeyRef,
        },
        { revert: ref(false) },
      )

      expect(core.cancelQueries).toHaveBeenCalledWith(
        queryClient,
        {
          queryKey: queryKeyUnref,
        },
        { revert: false },
      )
    })
  })

  describe('invalidateQueries', () => {
    it('should properly unwrap 2 parameter', () => {
      const queryClient = new QueryClient()

      queryInvalidateQueries(
        queryClient,
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(core.invalidateQueries).toHaveBeenCalledWith(
        queryClient,
        {
          queryKey: queryKeyUnref,
          refetchType: 'none',
        },
        { cancelRefetch: false },
      )
    })

    // #7694
    it('should call invalidateQueries immediately and refetchQueries after sleep', async () => {
      const invalidateQueries = vi.spyOn(core, 'invalidateQueries')
      const refetchQueries = vi.spyOn(core, 'refetchQueries')

      const queryClient = new QueryClient()

      queryInvalidateQueries(queryClient, {
        queryKey: queryKeyRef,
      })

      expect(invalidateQueries).toHaveBeenCalledWith(
        queryClient,
        { queryKey: queryKeyUnref, refetchType: 'none' },
        {},
      )
      expect(refetchQueries).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(0)
      expect(refetchQueries).toHaveBeenCalledWith(
        queryClient,
        { queryKey: queryKeyUnref, type: 'active' },
        {},
      )
    })

    it('should pass refetchType as type and the options to refetchQueries', async () => {
      const refetchQueries = vi.spyOn(core, 'refetchQueries')

      const queryClient = new QueryClient()

      queryInvalidateQueries(
        queryClient,
        { queryKey: queryKeyRef, refetchType: 'all', type: 'inactive' },
        { cancelRefetch: ref(false) },
      )

      await vi.advanceTimersByTimeAsync(0)
      expect(refetchQueries).toHaveBeenCalledWith(
        queryClient,
        { queryKey: queryKeyUnref, refetchType: 'all', type: 'all' },
        { cancelRefetch: false },
      )
    })

    it('should call invalidateQueries immediately and not call refetchQueries', async () => {
      const invalidateQueries = vi.spyOn(core, 'invalidateQueries')
      const refetchQueries = vi.spyOn(core, 'refetchQueries')

      const queryClient = new QueryClient()

      queryInvalidateQueries(queryClient, {
        queryKey: queryKeyRef,
        refetchType: 'none',
      })

      expect(invalidateQueries).toHaveBeenCalledWith(
        queryClient,
        { queryKey: queryKeyUnref, refetchType: 'none' },
        {},
      )
      expect(refetchQueries).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(0)
      expect(refetchQueries).not.toHaveBeenCalled()
    })
  })

  describe('refetchQueries', () => {
    it('should properly unwrap 2 parameter', () => {
      const queryClient = new QueryClient()

      queryRefetchQueries(
        queryClient,
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(core.refetchQueries).toHaveBeenCalledWith(
        queryClient,
        {
          queryKey: queryKeyUnref,
        },
        { cancelRefetch: false },
      )
    })
  })

  describe('query', () => {
    it('should read the cache when a ref holds skipToken', async () => {
      const client = new QueryClient()
      const queryKey = ['skipped', ref('key')]
      const options = { queryKey, queryFn: ref(skipToken) }

      await expect(query(client, options)).resolves.toBeUndefined()

      setQueryData(client, ['skipped', 'key'], 'cached')
      await expect(query(client, options)).resolves.toBe('cached')
    })

    it('should properly unwrap queryKey', () => {
      const queryClient = new QueryClient()

      query(queryClient, {
        queryKey: queryKeyRef,
      })

      expect(core.query).toHaveBeenCalledWith(queryClient, {
        queryKey: queryKeyUnref,
      })
    })

    it('should properly unwrap staleTime, and select', () => {
      const queryClient = new QueryClient()
      const staleTime = () => 1000
      const selection = querySelect((data: string) => data.length)

      query(queryClient, {
        queryKey: queryKeyRef,
        staleTime: ref(staleTime),
        select: ref(selection),
      })

      expect(core.query).toHaveBeenCalledWith(queryClient, {
        queryKey: queryKeyUnref,
        staleTime,
        select: selection,
      })
    })

    it('should accept explicitly resolved getter options and unwrap queryKey', () => {
      const queryClient = new QueryClient()
      const options = queryOptions(() => ({
        queryKey: queryKeyRef,
        queryFn: fn,
      }))

      query(queryClient, options())

      expect(core.query).toHaveBeenCalledWith(queryClient, {
        queryKey: queryKeyUnref,
        queryFn: fn,
      })
    })
  })

  describe('infiniteQuery', () => {
    it('should properly unwrap queryKey, initialPageParam, pages, and select', () => {
      const queryClient = new QueryClient()
      const getNextPageParam = () => 1
      const selection = querySelect(
        (data: { pages: Array<string> }) => data.pages.length,
      )

      infiniteQuery(queryClient, {
        queryKey: queryKeyRef,
        initialPageParam: ref(0),
        pages: ref(2),
        getNextPageParam: ref(getNextPageParam),
        select: ref(selection),
      })

      expect(core.infiniteQuery).toHaveBeenCalledWith(
        queryClient,
        expect.objectContaining({
          queryKey: queryKeyUnref,
          initialPageParam: 0,
          pages: 2,
          getNextPageParam,
          select: selection,
        }),
      )
    })

    it('should properly unwrap getNextPageParam when using infiniteQueryOptions', () => {
      const queryClient = new QueryClient()
      const getNextPageParam = () => 12

      const options = infiniteQueryOptions({
        queryKey: queryKeyRef,
        queryFn: fn,
        initialPageParam: ref(0),
        getNextPageParam: ref(getNextPageParam),
      })

      infiniteQuery(queryClient, {
        ...unref(options),
        staleTime: 0,
        pages: 1,
      })

      expect(core.infiniteQuery).toHaveBeenCalledWith(
        queryClient,
        expect.objectContaining({
          queryKey: queryKeyUnref,
          initialPageParam: 0,
          pages: 1,
          getNextPageParam,
        }),
      )
    })
  })

  describe('setDefaultOptions', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      setDefaultOptions(queryClient, {
        queries: {
          enabled: ref(false),
        },
      })

      expect(core.setDefaultOptions).toHaveBeenCalledWith(queryClient, {
        queries: {
          enabled: false,
        },
      })
    })
  })

  describe('setQueryDefaults', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      setQueryDefaults(queryClient, queryKeyRef, {
        enabled: ref(false),
      })

      expect(core.setQueryDefaults).toHaveBeenCalledWith(
        queryClient,
        queryKeyUnref,
        {
          enabled: false,
        },
      )
    })
  })

  describe('getQueryDefaults', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      getQueryDefaults(queryClient, queryKeyRef)

      expect(core.getQueryDefaults).toHaveBeenCalledWith(
        queryClient,
        queryKeyUnref,
      )
    })
  })

  describe('setMutationDefaults', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      setMutationDefaults(queryClient, queryKeyRef, {
        mutationKey: queryKeyRef,
      })

      expect(core.setMutationDefaults).toHaveBeenCalledWith(
        queryClient,
        queryKeyUnref,
        {
          mutationKey: queryKeyUnref,
        },
      )
    })
  })

  describe('getMutationDefaults', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      getMutationDefaults(queryClient, queryKeyRef)

      expect(core.getMutationDefaults).toHaveBeenCalledWith(
        queryClient,
        queryKeyUnref,
      )
    })
  })
})
