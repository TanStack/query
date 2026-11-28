import { QueryClient as CoreQueryClient } from '@tanstack/query-core'
import type {
  DefaultOptions as CoreDefaultOptions,
  QueryClientConfig as CoreQueryClientConfig,
  DefaultError,
  MutationKey,
  QueryKey,
} from '@tanstack/query-core'
import type {
  ThrowOnError,
  UseBaseQueryOptions,
  UseMutationOptions,
} from './types'

/** Client defaults, including the adapter's error boundary options. */
export interface DefaultOptions<
  TError = DefaultError,
> extends CoreDefaultOptions<TError> {
  /** Default query options, including whether to throw errors to an error boundary. */
  queries?: CoreDefaultOptions<TError>['queries'] &
    Pick<UseBaseQueryOptions<unknown, TError>, 'throwOnError'>
  /** Default mutation options, including whether to throw errors to an error boundary. */
  mutations?: CoreDefaultOptions<TError>['mutations'] &
    Pick<UseMutationOptions<unknown, TError, unknown>, 'throwOnError'>
}

/** Configuration for a query client with adapter-specific defaults. */
export interface QueryClientConfig extends CoreQueryClientConfig {
  /** Default options for all queries and mutations created through this client. */
  defaultOptions?: DefaultOptions
}

/** A query client that accepts the adapter's error boundary options as defaults. */
export interface QueryClient extends CoreQueryClient {
  /** {@inheritDoc CoreQueryClient.getDefaultOptions} */
  getDefaultOptions: () => DefaultOptions
  /** {@inheritDoc CoreQueryClient.setDefaultOptions} */
  setDefaultOptions: (options: DefaultOptions) => void

  /** {@inheritDoc CoreQueryClient.setQueryDefaults} */
  setQueryDefaults: <
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
  >(
    queryKey: QueryKey,
    options: Partial<
      Omit<
        UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData>,
        'queryKey' | 'subscribed'
      >
    >,
  ) => void

  /** {@inheritDoc CoreQueryClient.getQueryDefaults} */
  getQueryDefaults: (queryKey: QueryKey) => ReturnType<
    CoreQueryClient['getQueryDefaults']
  > & {
    throwOnError?: ThrowOnError<any, any, any, any>
  }

  /** {@inheritDoc CoreQueryClient.setMutationDefaults} */
  setMutationDefaults: <
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TOnMutateResult = unknown,
  >(
    mutationKey: MutationKey,
    options: Omit<
      UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
      'mutationKey'
    >,
  ) => void

  /** {@inheritDoc CoreQueryClient.getMutationDefaults} */
  getMutationDefaults: (
    mutationKey: MutationKey,
  ) => ReturnType<CoreQueryClient['getMutationDefaults']> &
    Pick<UseMutationOptions<any, any, any, any>, 'throwOnError'>
}

/** Creates a query client. The constructor is shared with query-core. */
export const QueryClient: {
  new (config?: QueryClientConfig): QueryClient
  readonly prototype: QueryClient
} = CoreQueryClient
