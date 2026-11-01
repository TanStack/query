import type {
  QueryStrictModeEvent,
  QueryStrictModeMissingPrefetchEvent,
  QueryStrictModeUnusedPrefetchEvent,
} from './QueryStrictModeTypes'

/**
 * The base class of the errors for the problems found by `QueryStrictMode`: a
 * {@link QueryStrictModeMissingPrefetchError} or a {@link QueryStrictModeUnusedPrefetchError}. Use
 * it to catch both in an error boundary.
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallbackRender={({ error }) =>
 *     error instanceof QueryStrictModeError ? (
 *       <pre>
 *         {error.event.type}: {error.event.query.queryHash}
 *       </pre>
 *     ) : (
 *       <GenericError />
 *     )
 *   }
 * >
 *   <QueryStrictMode>
 *     <Routes />
 *   </QueryStrictMode>
 * </ErrorBoundary>
 * ```
 */
export class QueryStrictModeError extends Error {
  /**
   * The problem the error was created for.
   */
  event: QueryStrictModeEvent
  /**
   * Creates the error for a problem found by `QueryStrictMode`. Passes down `event.message` as the
   * `Error.message`. Only called by the errors for each problem.
   * @param event - The problem the error is for.
   */
  protected constructor(event: QueryStrictModeEvent) {
    super(event.message)
    this.name = 'QueryStrictModeError'
    this.event = event
  }
}

/**
 * The error for a {@link QueryStrictModeMissingPrefetchEvent}. The default `handleMissingPrefetch`
 * throws it.
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallbackRender={({ error }) =>
 *     error instanceof QueryStrictModeMissingPrefetchError ? (
 *       <pre>Prefetch {error.event.query.queryHash} in the route loader</pre>
 *     ) : (
 *       <GenericError />
 *     )
 *   }
 * >
 *   <QueryStrictMode>
 *     <Routes />
 *   </QueryStrictMode>
 * </ErrorBoundary>
 * ```
 */
export class QueryStrictModeMissingPrefetchError extends QueryStrictModeError {
  /**
   * The missing prefetch the error was created for.
   */
  declare event: QueryStrictModeMissingPrefetchEvent
  /**
   * Creates the error for a missing prefetch.
   * @param event - The missing prefetch the error is for.
   */
  constructor(event: QueryStrictModeMissingPrefetchEvent) {
    super(event)
    this.name = 'QueryStrictModeMissingPrefetchError'
  }
}

/**
 * The error for a {@link QueryStrictModeUnusedPrefetchEvent}. The default `handleUnusedPrefetch`
 * only logs, so throw it from your own.
 * @example
 * ```tsx
 * <QueryStrictMode
 *   handleUnusedPrefetch={(event) => {
 *     throw new QueryStrictModeUnusedPrefetchError(event)
 *   }}
 * >
 *   <Routes />
 * </QueryStrictMode>
 * ```
 */
export class QueryStrictModeUnusedPrefetchError extends QueryStrictModeError {
  /**
   * The unused prefetch the error was created for.
   */
  declare event: QueryStrictModeUnusedPrefetchEvent
  /**
   * Creates the error for an unused prefetch.
   * @param event - The unused prefetch the error is for.
   */
  constructor(event: QueryStrictModeUnusedPrefetchEvent) {
    super(event)
    this.name = 'QueryStrictModeUnusedPrefetchError'
  }
}
