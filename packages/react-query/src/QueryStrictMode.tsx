'use client'
import { DevQueryStrictMode } from './QueryStrictModeDev'
import type { QueryStrictModeMissingPrefetchError } from './QueryStrictModeError'
import type {
  QueryStrictModeMissingPrefetchEvent,
  QueryStrictModeProps,
  QueryStrictModeUnusedPrefetchEvent,
} from './QueryStrictModeTypes'

/**
 * Reports prefetching issues in development. See
 * {@link QueryStrictModeMissingPrefetchEvent} and {@link QueryStrictModeUnusedPrefetchEvent}.
 *
 * By default, a missing prefetch throws a {@link QueryStrictModeMissingPrefetchError} to an error
 * boundary, and an unused prefetch is logged with `console.warn`. Pass `handleMissingPrefetch` or
 * `handleUnusedPrefetch` to filter problems, or to log or throw them instead.
 *
 * Only affects development builds; returns children in production.
 * @param props - The `children` to check, and optionally `handleMissingPrefetch`,
 * `handleUnusedPrefetch`, an `unusedPrefetchTimeout`, and a `queryClient`.
 * @returns The `children`.
 * @example
 * ```tsx
 * import { QueryStrictMode } from '@tanstack/react-query'
 *
 * function App() {
 *   return (
 *     <QueryStrictMode
 *       handleMissingPrefetch={(event) => {
 *         if (!event.query.meta?.allowWaterfall) console.warn(event.message)
 *       }}
 *     >
 *       <Routes />
 *     </QueryStrictMode>
 *   )
 * }
 * ```
 */
// A single expression, so that bundlers drop `DevQueryStrictMode` once `NODE_ENV` is replaced
export const QueryStrictMode = (props: QueryStrictModeProps) =>
  process.env.NODE_ENV === 'production' ? (
    props.children
  ) : (
    <DevQueryStrictMode {...props} />
  )
