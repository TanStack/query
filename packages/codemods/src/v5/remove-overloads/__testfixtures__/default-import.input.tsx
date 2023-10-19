import * as React from 'react'
import {
  useQuery,
  useIsFetching,
  useIsMutating,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeysFromAnotherModule } from '../another/module'

export const WithKnownParameters = () => {
  useIsFetching(['foo', 'bar'])
  useIsFetching(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true })
  useIsFetching(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true }, { context: undefined })
  useIsFetching(['foo', 'bar'], { type: 'all', exact: true })
  useIsFetching(['foo', 'bar'], { type: 'all', exact: true }, { context: undefined })
  useIsFetching({ queryKey: ['foo', 'bar'], type: 'all', exact: true })
  useIsFetching({ queryKey: ['foo', 'bar'], type: 'all', exact: true }, { context: undefined })

  useIsMutating(['foo', 'bar'])
  useIsMutating(['foo', 'bar'], { exact: true })
  useIsMutating(['foo', 'bar'], { exact: true }, { context: undefined })
  useIsMutating({ mutationKey: ['foo', 'bar'], exact: true })
  useIsMutating({ mutationKey: ['foo', 'bar'], exact: true }, { context: undefined })

  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries(['foo', 'bar'])
  queryClient.cancelQueries(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true })
  queryClient.cancelQueries(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true }, { silent: true })
  queryClient.cancelQueries(['foo', 'bar'], { type: 'all', exact: true })
  queryClient.cancelQueries(['foo', 'bar'], { type: 'all', exact: true }, { silent: true })
  queryClient.cancelQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true })
  queryClient.cancelQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true }, { silent: true })

  queryClient.getQueriesData(['foo', 'bar'])
  queryClient.getQueriesData({ queryKey: ['foo', 'bar'], type: 'all', exact: true })

  queryClient.invalidateQueries(['foo', 'bar'])
  queryClient.invalidateQueries(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true })
  queryClient.invalidateQueries(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })
  queryClient.invalidateQueries(['foo', 'bar'], { type: 'all', exact: true })
  queryClient.invalidateQueries(['foo', 'bar'], { type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })
  queryClient.invalidateQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true })
  queryClient.invalidateQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })

  queryClient.isFetching(['foo', 'bar'])
  queryClient.isFetching(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true })
  queryClient.isFetching(['foo', 'bar'], { type: 'all', exact: true })
  queryClient.isFetching({ queryKey: ['foo', 'bar'], type: 'all', exact: true })

  queryClient.refetchQueries(['foo', 'bar'])
  queryClient.refetchQueries(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true })
  queryClient.refetchQueries(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })
  queryClient.refetchQueries(['foo', 'bar'], { type: 'all', exact: true })
  queryClient.refetchQueries(['foo', 'bar'], { type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })
  queryClient.refetchQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true })
  queryClient.refetchQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })

  queryClient.removeQueries(['foo', 'bar'])
  queryClient.removeQueries(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true })
  queryClient.removeQueries({ queryKey: ['foo', 'bar'], type: 'all', exact: true })

  queryClient.resetQueries(['foo', 'bar'])
  queryClient.resetQueries(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true })
  queryClient.resetQueries(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })
  queryClient.resetQueries(['foo', 'bar'], { type: 'all', exact: true })
  queryClient.resetQueries(['foo', 'bar'], { type: 'all', exact: true }, { cancelRefetch: false, throwOnError: true })
  queryClient.resetQueries({ queryKey: ['foo', 'bar'], exact: true })
  queryClient.resetQueries({ queryKey: ['foo', 'bar'], exact: true }, { cancelRefetch: false, throwOnError: true })

  queryClient.setQueriesData(['foo', 'bar'], null)
  queryClient.setQueriesData(['foo', 'bar'], null, { updatedAt: 1000 })
  queryClient.setQueriesData({ queryKey: ['foo', 'bar'] }, null)
  queryClient.setQueriesData({ queryKey: ['foo', 'bar'] }, null, { updatedAt: 1000 })

  queryClient.fetchQuery(['foo', 'bar'])
  queryClient.fetchQuery(['foo', 'bar'], { queryKey: ['todos'], staleTime: 1000 })
  queryClient.fetchQuery(['foo', 'bar'], { queryKey: ['todos'], queryFn: () => 'data', staleTime: 1000 })
  queryClient.fetchQuery(['foo', 'bar'], () => 'data', { queryKey: ['todos'], staleTime: 1000 })
  queryClient.fetchQuery(['foo', 'bar'], function myFn() { return 'data' }, { queryKey: ['todos'], staleTime: 1000 })
  queryClient.fetchQuery({ queryKey: ['foo', 'bar'], queryFn: () => 'data', retry: true })

  const queryCache = queryClient.getQueryCache()

  queryCache.find(['foo', 'bar'])
  queryCache.find(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true })
  queryCache.find(['foo', 'bar'], { type: 'all', exact: true })

  queryCache.findAll(['foo', 'bar'])
  queryCache.findAll(['foo', 'bar'], { type: 'all', exact: true })
  queryCache.findAll(['foo', 'bar'], { queryKey: ['todos'], type: 'all', exact: true })
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

  useIsFetching(queryKey)
  useIsFetching(queryKey, filters)
  useIsFetching(queryKey, filters, options)
  useIsFetching(queryKey, { type: 'all', exact: true })
  useIsFetching(queryKey, { type: 'all', exact: true }, { context: undefined })
  useIsFetching(queryKey, { queryKey: ['todos'], ...filters }, options)
  useIsFetching({ queryKey: queryKey, ...filters })
  useIsFetching({ queryKey: queryKey, ...filters }, { context: undefined })

  useIsMutating(mutationKey)
  useIsMutating(mutationKey, { exact: true, status: 'idle' })
  useIsMutating(mutationKey, { ...mutationOptions, exact: false })
  useIsMutating({ mutationKey, ...mutationOptions })
  useIsMutating({ mutationKey: ['foo', 'bar'], exact: true, status: 'idle' })

  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries(queryKey)
  queryClient.cancelQueries(queryKey, filters)
  queryClient.cancelQueries(queryKey, filters, cancelOptions)
  queryClient.cancelQueries(queryKey, { type: 'all', exact: true })
  queryClient.cancelQueries(queryKey, { type: 'all', exact: true }, { revert: true })
  queryClient.cancelQueries(queryKey, { queryKey: ['todos'], ...filters }, cancelOptions)
  queryClient.cancelQueries({ queryKey: queryKey, type: 'all', exact: true })
  queryClient.cancelQueries({ queryKey: ['foo', 'bar'], ...filters }, cancelOptions)

  queryClient.getQueriesData(globalQueryKey)
  queryClient.getQueriesData({ queryKey: globalQueryKey, ...filters })
  queryClient.getQueriesData({ queryKey: ['foo', 'bar'], type: 'all' })

  queryClient.invalidateQueries(queryKey)
  queryClient.invalidateQueries(queryKey, filters)
  queryClient.invalidateQueries(queryKey, filters, invalidateOptions)
  queryClient.invalidateQueries(queryKey, { queryKey: ['todos'], stale: true, ...filters })
  queryClient.invalidateQueries(queryKey, { queryKey: ['todos'], stale: true, ...filters }, invalidateOptions)
  queryClient.invalidateQueries({ queryKey: globalQueryKey, ...filters, stale: true })
  queryClient.invalidateQueries({ queryKey: globalQueryKey, ...filters, stale: true }, invalidateOptions)

  queryClient.isFetching(globalQueryKey)
  queryClient.isFetching(globalQueryKey, filters)
  queryClient.isFetching(globalQueryKey, { queryKey: ['todos'], type: 'all', exact: true })
  queryClient.isFetching(globalQueryKey, { queryKey: ['todos'], ...filters })
  queryClient.isFetching({ queryKey: globalQueryKey, ...filters, stale: true })
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.isFetching(queryKeysFromAnotherModule)

  queryClient.refetchQueries(queryKey)
  queryClient.refetchQueries(queryKey, filters)
  queryClient.refetchQueries(queryKey, filters, refetchOptions)
  queryClient.refetchQueries(queryKey, { queryKey: ['todos'], ...filters }, { ...refetchOptions, cancelRefetch: true })
  queryClient.refetchQueries({ queryKey: queryKey, ...filters })
  queryClient.refetchQueries({ queryKey: queryKey, ...filters }, { ...refetchOptions, cancelRefetch: true })
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.refetchQueries(queryKeysFromAnotherModule)
  queryClient.refetchQueries(queryKeysFromAnotherModule, filters)
  queryClient.refetchQueries(queryKeysFromAnotherModule, filters, refetchOptions)

  queryClient.removeQueries(queryKey)
  queryClient.removeQueries(queryKey, filters)
  queryClient.removeQueries(queryKey, { queryKey: ['todos'], ...filters, stale: true })
  queryClient.removeQueries({ queryKey, ...filters, stale: true })
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.removeQueries(queryKeysFromAnotherModule)
  queryClient.removeQueries(queryKeysFromAnotherModule, filters)

  queryClient.resetQueries(queryKey)
  queryClient.resetQueries(queryKey, filters)
  queryClient.resetQueries(queryKey, filters, resetOptions)
  queryClient.resetQueries(queryKey, { queryKey: ['todos'], ...filters, stale: true })
  queryClient.resetQueries(queryKey, { queryKey: ['todos'], ...filters, stale: true }, resetOptions)
  queryClient.resetQueries({ queryKey, ...filters, stale: true })
  queryClient.resetQueries({ queryKey, ...filters, stale: true }, resetOptions)
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.resetQueries(queryKeysFromAnotherModule)
  queryClient.resetQueries(queryKeysFromAnotherModule, filters)
  queryClient.resetQueries(queryKeysFromAnotherModule, filters, resetOptions)

  queryClient.fetchQuery(queryKey)
  queryClient.fetchQuery(queryKey, fetchOptions)
  queryClient.fetchQuery(queryKey, { networkMode: 'always', ...fetchOptions })
  queryClient.fetchQuery(queryKey, queryFn, fetchOptions)
  queryClient.fetchQuery(queryKey, () => 'data', { networkMode: 'always', ...fetchOptions })
  // Stays as it is because the code couldn't infer the type of the "queryKeysFromAnotherModule" identifier.
  queryClient.fetchQuery(queryKeysFromAnotherModule)
  queryClient.fetchQuery(queryKeysFromAnotherModule, fetchOptions)
  queryClient.fetchQuery(queryKeysFromAnotherModule, queryFn, fetchOptions)
}

export const SecondArgumentIsAFunctionExample = () => {
  useQuery(ordersCacheKeys.groupOrders(ouuid), () => api.getPatientGroupOrders(ouuid).then((r) => r.data))

  const rest = 'rest'
  const of = 1
  const functionArguments = { foo: 'bar' }

  useQuery(ordersCacheKeys.groupOrders(ouuid), () => api.getPatientGroupOrders(ouuid).then((r) => r.data), rest, of, functionArguments)
}
