import { infiniteQueryBehavior } from '../infiniteQueryBehavior'

export function prepareInfiniteFetch<TQueryFnData, TError, TData, TPageParam>(
  ...args: Parameters<
    ReturnType<
      typeof infiniteQueryBehavior<TQueryFnData, TError, TData, TPageParam>
    >['onFetch']
  >
) {
  infiniteQueryBehavior<TQueryFnData, TError, TData, TPageParam>().onFetch(
    ...args,
  )
  return args[0].fetchFn
}
