import { ref } from 'vue-demi'
import { QueryClient as QueryClientOrigin } from '@tanstack/query-core'

import { QueryClient } from '../queryClient'

jest.mock('@tanstack/query-core')

const queryKeyRef = ['foo', ref('bar')]
const queryKeyUnref = ['foo', 'bar']

const fn = () => 'mock'

describe('QueryCache', () => {
  // beforeAll(() => {
  //   jest.spyOn(QueryCacheOrigin.prototype, "find");
  //   jest.spyOn(QueryCacheOrigin.prototype, "findAll");
  // });

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

    test('should properly unwrap 2 parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.isFetching(queryKeyRef, {
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.isFetching).toBeCalledWith(
        queryKeyUnref,
        {
          queryKey: queryKeyUnref,
        },
      )
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
    test('should properly unwrap 2 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.getQueryData(queryKeyRef, {
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.getQueryData).toBeCalledWith(
        queryKeyUnref,
        {
          queryKey: queryKeyUnref,
        },
      )
    })
  })

  describe('getQueriesData', () => {
    test('should properly unwrap queryKey param', async () => {
      const queryClient = new QueryClient()

      queryClient.getQueriesData(queryKeyRef)

      expect(QueryClientOrigin.prototype.getQueriesData).toBeCalledWith(
        queryKeyUnref,
      )
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

      queryClient.setQueryData(queryKeyRef, fn, { updatedAt: ref(3) })

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

      queryClient.setQueriesData(queryKeyRef, fn, { updatedAt: ref(3) })

      expect(QueryClientOrigin.prototype.setQueriesData).toBeCalledWith(
        queryKeyUnref,
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
    test('should properly unwrap 2 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.getQueryState(queryKeyRef, { queryKey: queryKeyRef })

      expect(QueryClientOrigin.prototype.getQueryState).toBeCalledWith(
        queryKeyUnref,
        { queryKey: queryKeyUnref },
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

    test('should properly unwrap 2 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.removeQueries(queryKeyRef, {
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.removeQueries).toBeCalledWith(
        queryKeyUnref,
        {
          queryKey: queryKeyUnref,
        },
      )
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

    test('should properly unwrap 3 parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.resetQueries(
        queryKeyRef,
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(QueryClientOrigin.prototype.resetQueries).toBeCalledWith(
        queryKeyUnref,
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

    test('should properly unwrap 3 parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.cancelQueries(
        queryKeyRef,
        {
          queryKey: queryKeyRef,
        },
        { revert: ref(false) },
      )

      expect(QueryClientOrigin.prototype.cancelQueries).toBeCalledWith(
        queryKeyUnref,
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

      expect(QueryClientOrigin.prototype.invalidateQueries).toBeCalledWith(
        {
          queryKey: queryKeyUnref,
        },
        { cancelRefetch: false },
      )
    })

    test('should properly unwrap 3 parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.invalidateQueries(
        queryKeyRef,
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(QueryClientOrigin.prototype.invalidateQueries).toBeCalledWith(
        queryKeyUnref,
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

    test('should properly unwrap 3 parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.refetchQueries(
        queryKeyRef,
        {
          queryKey: queryKeyRef,
        },
        { cancelRefetch: ref(false) },
      )

      expect(QueryClientOrigin.prototype.refetchQueries).toBeCalledWith(
        queryKeyUnref,
        {
          queryKey: queryKeyUnref,
        },
        { cancelRefetch: false },
      )
    })
  })

  describe('fetchQuery', () => {
    test('should properly unwrap 1 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.fetchQuery({
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.fetchQuery).toBeCalledWith({
        queryKey: queryKeyUnref,
      })
    })

    test('should properly unwrap 2 parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.fetchQuery(queryKeyRef, {
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.fetchQuery).toBeCalledWith(
        queryKeyUnref,
        {
          queryKey: queryKeyUnref,
        },
        undefined,
      )
    })

    test('should properly unwrap 3 parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.fetchQuery(queryKeyRef, fn, {
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.fetchQuery).toBeCalledWith(
        queryKeyUnref,
        fn,
        {
          queryKey: queryKeyUnref,
        },
      )
    })
  })

  describe('prefetchQuery', () => {
    test('should properly unwrap parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.prefetchQuery(queryKeyRef, fn, { queryKey: queryKeyRef })

      expect(QueryClientOrigin.prototype.prefetchQuery).toBeCalledWith(
        queryKeyUnref,
        fn,
        {
          queryKey: queryKeyUnref,
        },
      )
    })
  })

  describe('fetchInfiniteQuery', () => {
    test('should properly unwrap 1 parameter', async () => {
      const queryClient = new QueryClient()

      queryClient.fetchInfiniteQuery({
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.fetchInfiniteQuery).toBeCalledWith({
        queryKey: queryKeyUnref,
      })
    })

    test('should properly unwrap 2 parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.fetchInfiniteQuery(queryKeyRef, {
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.fetchInfiniteQuery).toBeCalledWith(
        queryKeyUnref,
        {
          queryKey: queryKeyUnref,
        },
        undefined,
      )
    })

    test('should properly unwrap 3 parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.fetchInfiniteQuery(queryKeyRef, fn, {
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.fetchInfiniteQuery).toBeCalledWith(
        queryKeyUnref,
        fn,
        {
          queryKey: queryKeyUnref,
        },
      )
    })
  })

  describe('prefetchInfiniteQuery', () => {
    test('should properly unwrap parameters', async () => {
      const queryClient = new QueryClient()

      queryClient.prefetchInfiniteQuery(queryKeyRef, fn, {
        queryKey: queryKeyRef,
      })

      expect(QueryClientOrigin.prototype.prefetchInfiniteQuery).toBeCalledWith(
        queryKeyUnref,
        fn,
        {
          queryKey: queryKeyUnref,
        },
      )
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
