import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue-demi'
import { QueryClient as QueryClientOrigin } from '@tanstack/query-core'
import { QueryClient } from '../queryClient'
import { infiniteQueryOptions } from '../infiniteQueryOptions'

vi.mock('@tanstack/query-core', async () => {
  const actual = await vi.importActual<{
    QueryClient: typeof QueryClientOrigin
  }>('@tanstack/query-core')

  // Get the prototype methods dynamically
  const prototypeMethods = Object.getOwnPropertyNames(
    actual.QueryClient.prototype,
  ).filter((prop): prop is keyof typeof actual.QueryClient.prototype => {
    const descriptor = Object.getOwnPropertyDescriptor(
      actual.QueryClient.prototype,
      prop,
    )
    return typeof descriptor?.value === 'function' && prop !== 'constructor'
  })

  // Spy on all methods in the prototype
  prototypeMethods.forEach((method) => {
    vi.spyOn(actual.QueryClient.prototype, method)
  })

  return actual
})

const queryKeyRef = ['foo', ref('bar')]
const queryKeyUnref = ['foo', 'bar']

const fn = () => 'mock'

describe('QueryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isFetching', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      queryClient.isFetching({
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.isFetching).toHaveBeenCalledWith({
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('isMutating', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      queryClient.isMutating({
        mutationKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.isMutating).toHaveBeenCalledWith({
        mutationKey: queryKeyUnref,
      })
    })
  })

  describe('getQueryData', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      queryClient.getQueryData(queryKeyRef)

      expect(QueryClientOrigin.prototype.getQueryData).toHaveBeenCalledWith(
        queryKeyUnref,
      )
    })
  })

  describe('ensureQueryData', () => {
    it('should properly unwrap parameter', () => {
      const queryClient = new QueryClient()

      queryClient.ensureQueryData({
        queryKey: queryKeyRef,
        queryFn: fn,
      })

      expect(QueryClientOrigin.prototype.ensureQueryData).toHaveBeenCalledWith({
        queryKey: queryKeyUnref,
        queryFn: fn,
      })
    })
  })

  describe('getQueriesData', () => {
    it('should properly unwrap queryKey param', () => {
      const queryClient = new QueryClient()

      queryClient.getQueriesData({ queryKey: queryKeyRef })

      expect(QueryClientOrigin.prototype.getQueriesData).toHaveBeenCalledWith({
        queryKey: queryKeyUnref,
      })
    })

    it('should properly unwrap filters param', () => {
      const queryClient = new QueryClient()

      queryClient.getQueriesData({ queryKey: queryKeyRef })

      expect(QueryClientOrigin.prototype.getQueriesData).toHaveBeenCalledWith({
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('setQueryData', () => {
    it('should properly unwrap 3 parameter', () => {
      const queryClient = new QueryClient()

      queryClient.setQueryData(queryKeyRef, fn, {
        updatedAt: ref(3),
      })

      expect(QueryClientOrigin.prototype.setQueryData).toHaveBeenCalledWith(
        queryKeyUnref,
        fn,
        { updatedAt: 3 },
      )
    })
  })

  describe('setQueriesData', () => {
    it('should properly unwrap params with queryKey', () => {
      const queryClient = new QueryClient()

      queryClient.setQueriesData({ queryKey: queryKeyRef }, fn, {
        updatedAt: ref(3),
      })

      expect(QueryClientOrigin.prototype.setQueriesData).toHaveBeenCalledWith(
        { queryKey: queryKeyUnref },
        fn,
        { updatedAt: 3 },
      )
    })

    it('should properly unwrap params with filters', () => {
      const queryClient = new QueryClient()

      queryClient.setQueriesData({ queryKey: queryKeyRef }, fn, {
        updatedAt: ref(3),
      })

      expect(QueryClientOrigin.prototype.setQueriesData).toHaveBeenCalledWith(
        { queryKey: queryKeyUnref },
        fn,
        { updatedAt: 3 },
      )
    })
  })

  describe('getQueryState', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      queryClient.getQueryState(queryKeyRef)

      expect(QueryClientOrigin.prototype.getQueryState).toHaveBeenCalledWith(
        queryKeyUnref,
      )
    })
  })

  describe('removeQueries', () => {
    it('should properly unwrap 1 parameter', () => {
      const queryClient = new QueryClient()

      queryClient.removeQueries({
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.removeQueries).toHaveBeenCalledWith({
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('resetQueries', () => {
    it('should properly unwrap 2 parameter', () => {
      const queryClient = new QueryClient()

      queryClient.resetQueries(
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(QueryClientOrigin.prototype.resetQueries).toHaveBeenCalledWith(
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

      queryClient.cancelQueries(
        {
          queryKey: queryKeyRef,
        },
        { revert: ref(false) },
      )

      expect(QueryClientOrigin.prototype.cancelQueries).toHaveBeenCalledWith(
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

      queryClient.invalidateQueries(
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(
        QueryClientOrigin.prototype.invalidateQueries,
      ).toHaveBeenCalledWith(
        {
          queryKey: queryKeyUnref,
          refetchType: 'none',
        },
        { cancelRefetch: false },
      )
    })

    // #7694
    it('should call invalidateQueries immediately and refetchQueries after sleep', async () => {
      const invalidateQueries = vi.spyOn(
        QueryClientOrigin.prototype,
        'invalidateQueries',
      )
      const refetchQueries = vi.spyOn(
        QueryClientOrigin.prototype,
        'refetchQueries',
      )

      const queryClient = new QueryClient()

      queryClient.invalidateQueries({
        queryKey: queryKeyRef,
      })

      expect(invalidateQueries).toHaveBeenCalled()
      expect(refetchQueries).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(0)

      expect(refetchQueries).toHaveBeenCalled()
    })

    it('should call invalidateQueries immediately and not call refetchQueries', async () => {
      const invalidateQueries = vi.spyOn(
        QueryClientOrigin.prototype,
        'invalidateQueries',
      )
      const refetchQueries = vi.spyOn(
        QueryClientOrigin.prototype,
        'refetchQueries',
      )

      const queryClient = new QueryClient()

      queryClient.invalidateQueries({
        queryKey: queryKeyRef,
        refetchType: 'none',
      })

      expect(invalidateQueries).toHaveBeenCalled()
      expect(refetchQueries).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(0)

      expect(refetchQueries).not.toHaveBeenCalled()
    })
  })

  describe('refetchQueries', () => {
    it('should properly unwrap 2 parameter', () => {
      const queryClient = new QueryClient()

      queryClient.refetchQueries(
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(QueryClientOrigin.prototype.refetchQueries).toHaveBeenCalledWith(
        {
          queryKey: queryKeyUnref,
        },
        { cancelRefetch: false },
      )
    })
  })

  describe('fetchQuery', () => {
    it('should properly unwrap parameter', () => {
      const queryClient = new QueryClient()

      queryClient.fetchQuery({
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.fetchQuery).toHaveBeenCalledWith({
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('prefetchQuery', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      queryClient.prefetchQuery({ queryKey: queryKeyRef, queryFn: fn })

      expect(QueryClientOrigin.prototype.prefetchQuery).toHaveBeenCalledWith({
        queryKey: queryKeyUnref,
        queryFn: fn,
      })
    })
  })

  describe('fetchInfiniteQuery', () => {
    it('should properly unwrap parameter', () => {
      const queryClient = new QueryClient()

      queryClient.fetchInfiniteQuery({
        queryKey: queryKeyRef,
        initialPageParam: 0,
      })

      expect(
        QueryClientOrigin.prototype.fetchInfiniteQuery,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          initialPageParam: 0,
          queryKey: queryKeyUnref,
        }),
      )
    })
    it('should properly unwrap parameter using infiniteQueryOptions with unref', () => {
      const queryClient = new QueryClient()

      const options = infiniteQueryOptions({
        queryKey: queryKeyUnref,
        initialPageParam: 0,
        getNextPageParam: () => 12,
      })

      queryClient.fetchInfiniteQuery(options)

      expect(
        QueryClientOrigin.prototype.fetchInfiniteQuery,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          initialPageParam: 0,
          queryKey: queryKeyUnref,
        }),
      )
    })
  })

  describe('prefetchInfiniteQuery', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      queryClient.prefetchInfiniteQuery({
        queryKey: queryKeyRef,
        queryFn: fn,
        initialPageParam: 0,
      })

      expect(
        QueryClientOrigin.prototype.prefetchInfiniteQuery,
      ).toHaveBeenCalledWith({
        initialPageParam: 0,
        queryKey: queryKeyUnref,
        queryFn: fn,
      })
    })
  })

  describe('setDefaultOptions', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      queryClient.setDefaultOptions({
        queries: {
          enabled: ref(false),
        },
      })

      expect(
        QueryClientOrigin.prototype.setDefaultOptions,
      ).toHaveBeenCalledWith({
        queries: {
          enabled: false,
        },
      })
    })
  })

  describe('setQueryDefaults', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      queryClient.setQueryDefaults(queryKeyRef, {
        enabled: ref(false),
      })

      expect(QueryClientOrigin.prototype.setQueryDefaults).toHaveBeenCalledWith(
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

      queryClient.getQueryDefaults(queryKeyRef)

      expect(QueryClientOrigin.prototype.getQueryDefaults).toHaveBeenCalledWith(
        queryKeyUnref,
      )
    })
  })

  describe('setMutationDefaults', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      queryClient.setMutationDefaults(queryKeyRef, {
        mutationKey: queryKeyRef,
      })

      expect(
        QueryClientOrigin.prototype.setMutationDefaults,
      ).toHaveBeenCalledWith(queryKeyUnref, {
        mutationKey: queryKeyUnref,
      })
    })
  })

  describe('getMutationDefaults', () => {
    it('should properly unwrap parameters', () => {
      const queryClient = new QueryClient()

      queryClient.getMutationDefaults(queryKeyRef)

      expect(
        QueryClientOrigin.prototype.getMutationDefaults,
      ).toHaveBeenCalledWith(queryKeyUnref)
    })
  })
})
