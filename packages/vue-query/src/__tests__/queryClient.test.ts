import { describe, expect, test, vi } from 'vitest'
import { ref } from 'vue-demi'
import { QueryClient as QueryClientOrigin } from '@tanstack/query-core'
import { QueryClient } from '../queryClient'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { flushPromises } from './test-utils'

vi.mock('@tanstack/query-core')

const queryKeyRef = ['foo', ref('bar')]
const queryKeyUnref = ['foo', 'bar']

const fn = () => 'mock'

describe('QueryCache', () => {
  describe('isFetching', () => {
    test('should properly unwrap 1 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.isFetching({
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.isFetching).toBeCalledWith({
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('isMutating', () => {
    test('should properly unwrap 1 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.isMutating({
        mutationKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.isMutating).toBeCalledWith({
        mutationKey: queryKeyUnref,
      })
    })
  })

  describe('getQueryData', () => {
    test('should properly unwrap 1 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.getQueryData(queryKeyRef)

      expect(QueryClientOrigin.prototype.getQueryData).toBeCalledWith(
        queryKeyUnref,
      )
    })
  })

  describe('getQueriesData', () => {
    test('should properly unwrap queryKey param', async () => {
      const queryClient = new QueryClient()

      queryClient.getQueriesData({ queryKey: queryKeyRef })

      expect(QueryClientOrigin.prototype.getQueriesData).toBeCalledWith({
        queryKey: queryKeyUnref,
      })
    })

    test('should properly unwrap filters param', async () => {
      const queryClient = new QueryClient()

      queryClient.getQueriesData({ queryKey: queryKeyRef })

      expect(QueryClientOrigin.prototype.getQueriesData).toBeCalledWith({
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('setQueryData', () => {
    test('should properly unwrap 3 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.setQueryData(queryKeyRef, fn, {
        updatedAt: ref(3),
      })

      expect(QueryClientOrigin.prototype.setQueryData).toBeCalledWith(
        queryKeyUnref,
        fn,
        { updatedAt: 3 },
      )
    })
  })

  describe('setQueriesData', () => {
    test('should properly unwrap params with queryKey', async () => {
      const queryClient = new QueryClient()

      queryClient.setQueriesData({ queryKey: queryKeyRef }, fn, {
        updatedAt: ref(3),
      })

      expect(QueryClientOrigin.prototype.setQueriesData).toBeCalledWith(
        { queryKey: queryKeyUnref },
        fn,
        { updatedAt: 3 },
      )
    })

    test('should properly unwrap params with filters', async () => {
      const queryClient = new QueryClient()

      queryClient.setQueriesData({ queryKey: queryKeyRef }, fn, {
        updatedAt: ref(3),
      })

      expect(QueryClientOrigin.prototype.setQueriesData).toBeCalledWith(
        { queryKey: queryKeyUnref },
        fn,
        { updatedAt: 3 },
      )
    })
  })

  describe('getQueryState', () => {
    test('should properly unwrap 1 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.getQueryState(queryKeyRef)

      expect(QueryClientOrigin.prototype.getQueryState).toBeCalledWith(
        queryKeyUnref,
      )
    })
  })

  describe('removeQueries', () => {
    test('should properly unwrap 1 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.removeQueries({
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.removeQueries).toBeCalledWith({
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('resetQueries', () => {
    test('should properly unwrap 2 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.resetQueries(
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(QueryClientOrigin.prototype.resetQueries).toBeCalledWith(
        {
          queryKey: queryKeyUnref,
        },
        { cancelRefetch: false },
      )
    })
  })

  describe('cancelQueries', () => {
    test('should properly unwrap 2 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.cancelQueries(
        {
          queryKey: queryKeyRef,
        },
        { revert: ref(false) },
      )

      expect(QueryClientOrigin.prototype.cancelQueries).toBeCalledWith(
        {
          queryKey: queryKeyUnref,
        },
        { revert: false },
      )
    })
  })

  describe('invalidateQueries', () => {
    test('should properly unwrap 2 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.invalidateQueries(
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      await flushPromises()

      expect(QueryClientOrigin.prototype.invalidateQueries).toBeCalledWith(
        {
          queryKey: queryKeyUnref,
        },
        { cancelRefetch: false },
      )
    })
  })

  describe('refetchQueries', () => {
    test('should properly unwrap 2 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.refetchQueries(
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(QueryClientOrigin.prototype.refetchQueries).toBeCalledWith(
        {
          queryKey: queryKeyUnref,
        },
        { cancelRefetch: false },
      )
    })
  })

  describe('fetchQuery', () => {
    test('should properly unwrap parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.fetchQuery({
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.fetchQuery).toBeCalledWith({
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('prefetchQuery', () => {
    test('should properly unwrap parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.prefetchQuery({ queryKey: queryKeyRef, queryFn: fn })

      expect(QueryClientOrigin.prototype.prefetchQuery).toBeCalledWith({
        queryKey: queryKeyUnref,
        queryFn: fn,
      })
    })
  })

  describe('fetchInfiniteQuery', () => {
    test('should properly unwrap parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.fetchInfiniteQuery({
        queryKey: queryKeyRef,
        initialPageParam: 0,
      })

      expect(QueryClientOrigin.prototype.fetchInfiniteQuery).toBeCalledWith({
        initialPageParam: 0,
        queryKey: queryKeyUnref,
      })
    })
    test('should properly unwrap parameter using infiniteQueryOptions with unref', async () => {
      const queryClient = new QueryClient()

      const options = infiniteQueryOptions({
        queryKey: queryKeyUnref,
        initialPageParam: 0,
        getNextPageParam: () => 12,
      })

      queryClient.fetchInfiniteQuery(options)

      expect(QueryClientOrigin.prototype.fetchInfiniteQuery).toBeCalledWith({
        initialPageParam: 0,
        queryKey: queryKeyUnref,
      })
    })
  })

  describe('prefetchInfiniteQuery', () => {
    test('should properly unwrap parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.prefetchInfiniteQuery({
        queryKey: queryKeyRef,
        queryFn: fn,
        initialPageParam: 0,
      })

      expect(QueryClientOrigin.prototype.prefetchInfiniteQuery).toBeCalledWith({
        initialPageParam: 0,
        queryKey: queryKeyUnref,
        queryFn: fn,
      })
    })
  })

  describe('setDefaultOptions', () => {
    test('should properly unwrap parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.setDefaultOptions({
        queries: {
          enabled: ref(false),
        },
      })

      expect(QueryClientOrigin.prototype.setDefaultOptions).toBeCalledWith({
        queries: {
          enabled: false,
        },
      })
    })
  })

  describe('setQueryDefaults', () => {
    test('should properly unwrap parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.setQueryDefaults(queryKeyRef, {
        enabled: ref(false),
      })

      expect(QueryClientOrigin.prototype.setQueryDefaults).toBeCalledWith(
        queryKeyUnref,
        {
          enabled: false,
        },
      )
    })
  })

  describe('getQueryDefaults', () => {
    test('should properly unwrap parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.getQueryDefaults(queryKeyRef)

      expect(QueryClientOrigin.prototype.getQueryDefaults).toBeCalledWith(
        queryKeyUnref,
      )
    })
  })

  describe('setMutationDefaults', () => {
    test('should properly unwrap parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.setMutationDefaults(queryKeyRef, {
        mutationKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.setMutationDefaults).toBeCalledWith(
        queryKeyUnref,
        {
          mutationKey: queryKeyUnref,
        },
      )
    })
  })

  describe('getMutationDefaults', () => {
    test('should properly unwrap parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.getMutationDefaults(queryKeyRef)

      expect(QueryClientOrigin.prototype.getMutationDefaults).toBeCalledWith(
        queryKeyUnref,
      )
    })
  })
})
