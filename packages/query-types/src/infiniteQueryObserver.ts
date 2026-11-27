import type { RuntimeBinding } from './binding'
import type {
  DefaultedInfiniteQueryObserverOptions,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
} from './types'

type InfiniteQueryObserverListener<TData, TError> = (
  result: InfiniteQueryObserverResult<TData, TError>,
) => void

type InfiniteObserverOptionsInput<
  TRuntime extends RuntimeBinding,
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> =
  | InfiniteQueryObserverOptions<
      TRuntime,
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  | DefaultedInfiniteQueryObserverOptions<
      TRuntime,
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >

type ReplaceReturnType<
  TFunction extends (...args: Array<any>) => unknown,
  TReturn,
> = (...args: Parameters<TFunction>) => TReturn

export type {
  InfiniteQueryObserverListener,
  InfiniteObserverOptionsInput,
  ReplaceReturnType,
}
