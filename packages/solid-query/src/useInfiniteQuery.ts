import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createMemo } from 'solid-js'
import { useBaseQueryLayer } from './useBaseQuery'
import type {
  DefaultError,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteData,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type {
  DefinedUseInfiniteQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from './types'
import type { Accessor } from 'solid-js'
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'

/**
 * Page-boundary checks, mirrored from query-core's `infiniteQueryBehavior`
 * (they are module-private there — not exported through the package index).
 * Pure functions of options + cached data; keep byte-compatible with core.
 */
interface PageParamsOptions {
  getNextPageParam: (
    lastPage: unknown,
    pages: Array<unknown>,
    lastPageParam: unknown,
    pageParams: Array<unknown>,
  ) => unknown
  getPreviousPageParam?: (
    firstPage: unknown,
    pages: Array<unknown>,
    firstPageParam: unknown,
    pageParams: Array<unknown>,
  ) => unknown
}

function hasNextPage(
  options: PageParamsOptions,
  data?: InfiniteData<unknown>,
): boolean {
  if (!data || data.pages.length === 0) return false
  const lastIndex = data.pages.length - 1
  return (
    options.getNextPageParam(
      data.pages[lastIndex],
      data.pages,
      data.pageParams[lastIndex],
      data.pageParams,
    ) != null
  )
}

function hasPreviousPage(
  options: PageParamsOptions,
  data?: InfiniteData<unknown>,
): boolean {
  if (!data || data.pages.length === 0 || !options.getPreviousPageParam)
    return false
  return (
    options.getPreviousPageParam(
      data.pages[0],
      data.pages,
      data.pageParams[0],
      data.pageParams,
    ) != null
  )
}

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): DefinedUseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): UseInfiniteQueryResult<TData, TError>

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): UseInfiniteQueryResult<TData, TError> {
  /**
   * Pagers ride the same entry as every other read: the base layer owns
   * the data node, meta projection, and lifecycle observer (an
   * `InfiniteQueryObserver`, so mount policy and refetches use the
   * infinite behavior). This layer adds the page surface on top.
   */
  const layer = useBaseQueryLayer(
    // `_type` is how query-core stamps a cache entry as infinite
    // (`Query.setOptions` → `#queryType`), which makes every fetch attach
    // `infiniteQueryBehavior`. Core only sets it inside
    // `InfiniteQueryObserver.setOptions`, but the adapter's pull path can
    // build and fetch the entry first (reactive key change recomputes the
    // data memo before the deferred observer effect runs) — without the
    // stamp that fetch would run as a plain query and corrupt the entry.
    createMemo(() => ({ ...options(), _type: 'infinite' }) as any),
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  )
  const observer = layer.observer as unknown as InfiniteQueryObserver<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >

  /** Committed fetch direction — set when a page fetch dispatches,
   * version-tracked through the layer's query accessor. */
  const direction = () =>
    (layer.query().state.fetchMeta as any)?.fetchMore?.direction

  const pageOptions = () => layer.defaultedOptions() as unknown as PageParamsOptions
  const infiniteData = () =>
    layer.query().state.data as InfiniteData<unknown> | undefined

  const isFetchingNextPage = () =>
    layer.isFetching() && direction() === 'forward'
  const isFetchingPreviousPage = () =>
    layer.isFetching() && direction() === 'backward'
  const isError = () => layer.status() === 'error'

  // The base result's getters transfer as-is; the infinite surface layers
  // over them, and isRefetching/isRefetchError narrow to exclude page
  // fetches (matching core's InfiniteQueryObserver result shape).
  const result = Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(layer.result),
      fetchNextPage: {
        value: (fetchOptions?: FetchNextPageOptions) =>
          observer.fetchNextPage(fetchOptions),
        enumerable: true,
      },
      fetchPreviousPage: {
        value: (fetchOptions?: FetchPreviousPageOptions) =>
          observer.fetchPreviousPage(fetchOptions),
        enumerable: true,
      },
      hasNextPage: {
        get: () => hasNextPage(pageOptions(), infiniteData()),
        enumerable: true,
      },
      hasPreviousPage: {
        get: () => hasPreviousPage(pageOptions(), infiniteData()),
        enumerable: true,
      },
      isFetchingNextPage: {
        get: isFetchingNextPage,
        enumerable: true,
      },
      isFetchingPreviousPage: {
        get: isFetchingPreviousPage,
        enumerable: true,
      },
      isFetchNextPageError: {
        get: () => isError() && direction() === 'forward',
        enumerable: true,
      },
      isFetchPreviousPageError: {
        get: () => isError() && direction() === 'backward',
        enumerable: true,
      },
      isRefetching: {
        get: () =>
          layer.isFetching() &&
          layer.status() !== 'pending' &&
          !isFetchingNextPage() &&
          !isFetchingPreviousPage(),
        enumerable: true,
      },
      isRefetchError: {
        get: () => {
          const errored = isError() && layer.query().state.dataUpdatedAt !== 0
          return errored && direction() === undefined
        },
        enumerable: true,
      },
    },
  ) as InfiniteQueryObserverResult<TData, TError>

  return result as unknown as UseInfiniteQueryResult<TData, TError>
}
