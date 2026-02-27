'use client'
import * as React from 'react'
import {
  MutationObserver,
  noop,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from './types'
import type {
  DefaultError,
  InferErrorFromFn,
  MutationFunction,
  QueryClient,
  StripThrows,
  ThrowsFnOptions,
} from '@tanstack/query-core'

type MutationFnData<TMutationFn extends (...args: Array<any>) => any> =
  StripThrows<Awaited<ReturnType<TMutationFn>>>

type MutationFnVariables<TMutationFn extends (...args: Array<any>) => any> =
  Parameters<TMutationFn> extends [] ? void : Parameters<TMutationFn>[0]

// HOOK

export function useMutation<
  TMutationFn extends MutationFunction<any, any>,
  TOnMutateResult = unknown,
>(
  options: ThrowsFnOptions<
    TMutationFn,
    Omit<
      UseMutationOptions<
        MutationFnData<TMutationFn>,
        InferErrorFromFn<TMutationFn>,
        MutationFnVariables<TMutationFn>,
        TOnMutateResult
      >,
      'mutationFn'
    > & { mutationFn: TMutationFn }
  >,
  queryClient?: QueryClient,
): UseMutationResult<
  MutationFnData<TMutationFn>,
  InferErrorFromFn<TMutationFn>,
  MutationFnVariables<TMutationFn>,
  TOnMutateResult
>

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult>

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult> {
  const client = useQueryClient(queryClient)

  const [observer] = React.useState(
    () =>
      new MutationObserver<TData, TError, TVariables, TOnMutateResult>(
        client,
        options,
      ),
  )

  React.useEffect(() => {
    observer.setOptions(options)
  }, [observer, options])

  const result = React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer],
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  )

  const mutate = React.useCallback<
    UseMutateFunction<TData, TError, TVariables, TOnMutateResult>
  >(
    (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop)
    },
    [observer],
  )

  if (
    result.error &&
    shouldThrowError(observer.options.throwOnError, [result.error])
  ) {
    throw result.error
  }

  return { ...result, mutate, mutateAsync: result.mutate }
}
