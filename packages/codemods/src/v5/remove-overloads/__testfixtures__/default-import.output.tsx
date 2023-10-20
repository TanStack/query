import * as React from 'react'
import {
  useIsFetching,
  useIsMutating,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeysFromAnotherModule } from '../another/module'

export const WithKnownParameters = () => {
  useIsFetching({
    queryKey: ['foo', 'bar']
  })
  useIsFetching({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  useIsFetching({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { context: undefined })
  useIsFetching({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  useIsFetching({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { context: undefined })
  useIsFetching({ queryKey: ['foo', 'bar'], type: 'all', exact: true })
  useIsFetching({ queryKey: ['foo', 'bar'], type: 'all', exact: true }, { context: undefined })

  useIsMutating({
    mutationKey: ['foo', 'bar']
  })
  useIsMutating({
    mutationKey: ['foo', 'bar'],
    exact: true
  })
  useIsMutating({
    mutationKey: ['foo', 'bar'],
    exact: true
  }, { context: undefined })
  useIsMutating({ mutationKey: ['foo', 'bar'], exact: true })
  useIsMutating({ mutationKey: ['foo', 'bar'], exact: true }, { context: undefined })

  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: ['foo', 'bar']
  })
  queryClient.cancelQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.cancelQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { silent: true })
  queryClient.cancelQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.cancelQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { silent: true })
  queryClient.cancelQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true })
  queryClient.cancelQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true }, { silent: true })

  queryClient.getQueriesData({
    queryKey: ['foo', 'bar']
  })
  queryClient.getQueriesData({ queryKey: ['foo', 'bar'], type: 'all', exact: true })

  queryClient.invalidateQueries({
    queryKey: ['foo', 'bar']
  })
  queryClient.invalidateQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.invalidateQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { cancelRefetch: false, throwOnError: true })
  queryClient.invalidateQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.invalidateQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { cancelRefetch: false, throwOnError: true })
  queryClient.invalidateQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true })
  queryClient.invalidateQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })

  queryClient.isFetching({
    queryKey: ['foo', 'bar']
  })
  queryClient.isFetching({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.isFetching({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.isFetching({ queryKey: ['foo', 'bar'], type: 'all', exact: true })

  queryClient.refetchQueries({
    queryKey: ['foo', 'bar']
  })
  queryClient.refetchQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.refetchQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { cancelRefetch: false, throwOnError: true })
  queryClient.refetchQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.refetchQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { cancelRefetch: false, throwOnError: true })
  queryClient.refetchQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true })
  queryClient.refetchQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })

  queryClient.removeQueries({
    queryKey: ['foo', 'bar']
  })
  queryClient.removeQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.removeQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true })

  queryClient.resetQueries({
    queryKey: ['foo', 'bar']
  })
  queryClient.resetQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.resetQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { cancelRefetch: false, throwOnError: true })
  queryClient.resetQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryClient.resetQueries({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  }, { cancelRefetch: false, throwOnError: true })
  queryClient.resetQueries({ queryKey: ['foo', 'bar'], exact: true })
  queryClient.resetQueries({ queryKey: ['foo', 'bar'], exact: true }, { cancelRefetch: false, throwOnError: true })

  queryClient.setQueriesData(['foo', 'bar'], null)
  queryClient.setQueriesData(['foo', 'bar'], null, { updatedAt: 1000 })
  queryClient.setQueriesData({ queryKey: ['foo', 'bar'] }, null)
  queryClient.setQueriesData({ queryKey: ['foo', 'bar'] }, null, { updatedAt: 1000 })

  queryClient.fetchQuery({
    queryKey: ['foo', 'bar']
  })
  queryClient.fetchQuery({
    queryKey: ['foo', 'bar'],
    staleTime: 1000
  })
  queryClient.fetchQuery({
    queryKey: ['foo', 'bar'],
    queryFn: () => 'data',
    staleTime: 1000
  })
  queryClient.fetchQuery({
    queryKey: ['foo', 'bar'],
    queryFn: () => 'data',
    staleTime: 1000
  })
  queryClient.fetchQuery({
    queryKey: ['foo', 'bar'],
    queryFn: function myFn() { return 'data' },
    staleTime: 1000
  })
  queryClient.fetchQuery({ queryKey: ['foo', 'bar'], queryFn: () => 'data', retry: true })

  const queryCache = queryClient.getQueryCache()

  queryCache.find({
    queryKey: ['foo', 'bar']
  })
  queryCache.find({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryCache.find({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })

  queryCache.findAll({
    queryKey: ['foo', 'bar']
  })
  queryCache.findAll({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryCache.findAll({
    queryKey: ['foo', 'bar'],
    type: 'all',
    exact: true
  })
  queryCache.findAll({ queryKey: ['foo', 'bar'], type: 'all', exact: true })

  return <div>Example Component</div>
}

const globalQueryKey = ['module', 'level']

export const WithIdentifiers = () => {
  const queryKey = ['foo', 'bar']
  const mutationKey = ['posts', 'articles']
  const filters = { type: 'all', exact: true } as const
  const options = { context: undefined } as const
  const mutationOptions = { exact: true, fetching: false } as const
  const cancelOptions = { silent: true } as const
  const invalidateOptions = { cancelRefetch: true, throwOnError: true } as const
  const refetchOptions = { cancelRefetch: false, throwOnError: true } as const
  const resetOptions = { cancelRefetch: false, throwOnError: true } as const
  const fetchOptions = { queryFn: () => 'data', retry: true } as const
  const queryFn = () => 'data'

  useIsFetching({
    queryKey: queryKey
  })
  useIsFetching({
    queryKey: queryKey,
    ...filters
  })
  useIsFetching({
    queryKey: queryKey,
    ...filters
  }, options)
  useIsFetching({
    queryKey: queryKey,
    type: 'all',
    exact: true
  })
  useIsFetching({
    queryKey: queryKey,
    type: 'all',
    exact: true
  }, { context: undefined })
  useIsFetching({
    queryKey: queryKey,
    ...filters
  }, options)
  useIsFetching({ queryKey: queryKey, ...filters })
  useIsFetching({ queryKey: queryKey, ...filters }, { context: undefined })

  useIsMutating({
    mutationKey: mutationKey
  })
  useIsMutating({
    mutationKey: mutationKey,
    exact: true,
    status: 'idle'
  })
  useIsMutating({
    mutationKey: mutationKey,
    ...mutationOptions,
    exact: false
  })
  useIsMutating({ mutationKey, ...mutationOptions })
  useIsMutating({ mutationKey: ['foo', 'bar'], exact: true, status: 'idle' })

  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: queryKey
  })
  queryClient.cancelQueries({
    queryKey: queryKey,
    ...filters
  })
  queryClient.cancelQueries({
    queryKey: queryKey,
    ...filters
  }, cancelOptions)
  queryClient.cancelQueries({
    queryKey: queryKey,
    type: 'all',
    exact: true
  })
  queryClient.cancelQueries({
    queryKey: queryKey,
    type: 'all',
    exact: true
  }, { revert: true })
  queryClient.cancelQueries({
    queryKey: queryKey,
    ...filters
  }, cancelOptions)
  queryClient.cancelQueries({ queryKey: queryKey, type: 'all', exact: true })
  queryClient.cancelQueries({ queryKey: ['foo', 'bar'], ...filters }, cancelOptions)

  queryClient.getQueriesData({
    queryKey: globalQueryKey
  })
  queryClient.getQueriesData({ queryKey: globalQueryKey, ...filters })
  queryClient.getQueriesData({ queryKey: ['foo', 'bar'], type: 'all' })

  queryClient.invalidateQueries({
    queryKey: queryKey
  })
  queryClient.invalidateQueries({
    queryKey: queryKey,
    ...filters
  })
  queryClient.invalidateQueries({
    queryKey: queryKey,
    ...filters
  }, invalidateOptions)
  queryClient.invalidateQueries({
    queryKey: queryKey,
    stale: true,
    ...filters
  })
  queryClient.invalidateQueries({
    queryKey: queryKey,
    stale: true,
    ...filters
  }, invalidateOptions)
  queryClient.invalidateQueries({ queryKey: globalQueryKey, ...filters, stale: true })
  queryClient.invalidateQueries({ queryKey: globalQueryKey, ...filters, stale: true }, invalidateOptions)

  queryClient.isFetching({
    queryKey: globalQueryKey
  })
  queryClient.isFetching({
    queryKey: globalQueryKey,
    ...filters
  })
  queryClient.isFetching({
    queryKey: globalQueryKey,
    type: 'all',
    exact: true
  })
  queryClient.isFetching({
    queryKey: globalQueryKey,
    ...filters
  })
  queryClient.isFetching({ queryKey: globalQueryKey, ...filters, stale: true })
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.isFetching(queryKeysFromAnotherModule)

  queryClient.refetchQueries({
    queryKey: queryKey
  })
  queryClient.refetchQueries({
    queryKey: queryKey,
    ...filters
  })
  queryClient.refetchQueries({
    queryKey: queryKey,
    ...filters
  }, refetchOptions)
  queryClient.refetchQueries({
    queryKey: queryKey,
    ...filters
  }, { ...refetchOptions, cancelRefetch: true })
  queryClient.refetchQueries({ queryKey: queryKey, ...filters })
  queryClient.refetchQueries({ queryKey: queryKey, ...filters }, { ...refetchOptions, cancelRefetch: true })
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.refetchQueries(queryKeysFromAnotherModule)
  queryClient.refetchQueries(queryKeysFromAnotherModule, filters)
  queryClient.refetchQueries(queryKeysFromAnotherModule, filters, refetchOptions)

  queryClient.removeQueries({
    queryKey: queryKey
  })
  queryClient.removeQueries({
    queryKey: queryKey,
    ...filters
  })
  queryClient.removeQueries({
    queryKey: queryKey,
    ...filters,
    stale: true
  })
  queryClient.removeQueries({ queryKey, ...filters, stale: true })
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.removeQueries(queryKeysFromAnotherModule)
  queryClient.removeQueries(queryKeysFromAnotherModule, filters)

  queryClient.resetQueries({
    queryKey: queryKey
  })
  queryClient.resetQueries({
    queryKey: queryKey,
    ...filters
  })
  queryClient.resetQueries({
    queryKey: queryKey,
    ...filters
  }, resetOptions)
  queryClient.resetQueries({
    queryKey: queryKey,
    ...filters,
    stale: true
  })
  queryClient.resetQueries({
    queryKey: queryKey,
    ...filters,
    stale: true
  }, resetOptions)
  queryClient.resetQueries({ queryKey, ...filters, stale: true })
  queryClient.resetQueries({ queryKey, ...filters, stale: true }, resetOptions)
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.resetQueries(queryKeysFromAnotherModule)
  queryClient.resetQueries(queryKeysFromAnotherModule, filters)
  queryClient.resetQueries(queryKeysFromAnotherModule, filters, resetOptions)

  queryClient.fetchQuery({
    queryKey: queryKey
  })
  queryClient.fetchQuery({
    queryKey: queryKey,
    ...fetchOptions
  })
  queryClient.fetchQuery({
    queryKey: queryKey,
    networkMode: 'always',
    ...fetchOptions
  })
  queryClient.fetchQuery({
    queryKey: queryKey,
    queryFn: queryFn,
    ...fetchOptions
  })
  queryClient.fetchQuery({
    queryKey: queryKey,
    queryFn: () => 'data',
    networkMode: 'always',
    ...fetchOptions
  })
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.fetchQuery(queryKeysFromAnotherModule)
  queryClient.fetchQuery(queryKeysFromAnotherModule, fetchOptions)
  queryClient.fetchQuery(queryKeysFromAnotherModule, queryFn, fetchOptions)
}

export const SecondArgumentIsAFunctionExample = () => {
  useQuery({
    queryKey: ordersCacheKeys.groupOrders(ouuid),
    queryFn: () => api.getPatientGroupOrders(ouuid).then((r) => r.data)
  })

  const rest = 'rest'
  const of = 1
  const functionArguments = { foo: 'bar' }

  useQuery({
    queryKey: ordersCacheKeys.groupOrders(ouuid),
    queryFn: () => api.getPatientGroupOrders(ouuid).then((r) => r.data)
  }, rest, of, functionArguments)
}
