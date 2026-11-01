import * as React from 'react'
import { experimental_waterfallHandle, hashKey } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'

import type {
  experimental_QueryHandle as QueryHandle,
  experimental_QueryHandleFactory as QueryHandleFactory,
  experimental_QueryHandleInput as QueryHandleInput,
} from '@tanstack/query-core'

/**
 * Starts a query from an input that is only known during render, and returns its handle. Prefer
 * starting queries in a route loader or server component with `experimental_prefetchHandle`: a
 * query started here can't begin until this component renders, which makes it a request
 * waterfall, and the name keeps that visible.
 *
 * Like `usePrefetchQuery`, it starts the query only if the cache has never fetched it, so it is
 * safe to call on every render, and it runs during server renders too. Read the query with
 * `useQuery(experimental_fromHandle(factory, handle))` or `useSuspenseQuery`.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A handle for the query, stable while the input maps to the same query.
 * @example
 * ```tsx
 * function Search(props: { term: string }) {
 *   const results = experimental_useWaterfall(searchQuery, { term: props.term })
 *   return <Results results={results} />
 * }
 * ```
 */
export function useWaterfall<TFactory extends QueryHandleFactory>(
  factory: TFactory,
  ...input: Parameters<TFactory>
): QueryHandle<TFactory>
/**
 * Switches a handle a loader passed down to a new input, like the next page, and returns the
 * handle of the query for that input. Prefer passing the new input to the loader through the URL:
 * a query started here can't begin until this component renders, which makes it a request
 * waterfall, and the name keeps that visible.
 *
 * While the switched input maps to the handle's own query, the handle is returned as is and
 * nothing starts. Otherwise the query for the new input starts if the cache has never fetched it.
 * @param factory - The factory that started the handle's query.
 * @param handle - The handle to switch from.
 * @param switchInput - Returns the new input, given the handle's input.
 * @returns `handle` while the switched input maps to its query, otherwise a handle for the new
 * input, stable while the input maps to the same query.
 * @example
 * ```tsx
 * function Posts(props: { posts: experimental_QueryHandle<typeof postsQuery> }) {
 *   const [page, setPage] = React.useState(1)
 *   const posts = experimental_useWaterfall(postsQuery, props.posts, (input) => ({
 *     ...input,
 *     page,
 *   }))
 *   const { data } = useQuery(experimental_fromHandle(postsQuery, posts))
 * }
 * ```
 */
export function useWaterfall<TFactory extends QueryHandleFactory>(
  factory: TFactory,
  handle: QueryHandle<TFactory>,
  switchInput: (
    input: QueryHandleInput<TFactory>,
  ) => QueryHandleInput<TFactory>,
): QueryHandle<TFactory>
export function useWaterfall<TFactory extends QueryHandleFactory>(
  factory: TFactory,
  ...args: Array<any>
): QueryHandle<TFactory> {
  const [inputOrHandle, switchInput] = args as [
    unknown,
    ((input: QueryHandleInput<TFactory>) => QueryHandleInput<TFactory>)?,
  ]
  const client = useQueryClient()
  const previous =
    typeof switchInput === 'function'
      ? (inputOrHandle as QueryHandle<TFactory>)
      : undefined
  const input = previous
    ? switchInput!(previous.input)
    : (inputOrHandle as QueryHandleInput<TFactory>)

  const next = experimental_waterfallHandle(client, factory, input, previous)
  const nextHash = next === previous ? '' : hashKey([next.queryKey, next.input])
  // oxlint-disable-next-line react-hooks-js/exhaustive-deps -- 'next' is a new object on every render, so the memo keys on the query and input it refers to
  const stable = React.useMemo(() => next, [previous, nextHash])

  return next === previous ? previous : stable
}
