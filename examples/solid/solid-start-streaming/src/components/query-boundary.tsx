/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { CreateQueryResult } from '@tanstack/solid-query'
import type { JSX } from 'solid-js'
import { Match, Suspense, Switch } from 'solid-js'

export interface QueryBoundaryProps<T = unknown> {
  query: CreateQueryResult<T, Error>

  /**
   * Triggered when the data is initially loading.
   */
  loadingFallback?: JSX.Element

  /**
   * Triggered when fetching is complete, but the returned data was falsey.
   */
  notFoundFallback?: JSX.Element

  /**
   * Triggered when the query results in an error.
   */
  errorFallback?: JSX.Element

  /**
   * Triggered when fetching is complete, and the returned data is not falsey.
   */
  children: (data: Exclude<T, null | false | undefined>) => JSX.Element
}

/**
 * Convenience wrapper that handles suspense and errors for queries. Makes the results of query.data available to
 * children (as a render prop) in a type-safe way.
 */
export function QueryBoundary<T>(props: QueryBoundaryProps<T>) {
  return (
    <Suspense fallback={props.loadingFallback}>
      <Switch>
        <Match when={props.query.isError}>
          {props.errorFallback ? (
            props.errorFallback
          ) : (
            <div>
              <div class="error">{props.query.error?.message}</div>
              <button
                onClick={() => {
                  props.query.refetch()
                }}
              >
                retry
              </button>
            </div>
          )}
        </Match>

        <Match when={!props.query.isFetching && !props.query.data}>
          {props.notFoundFallback ? (
            props.notFoundFallback
          ) : (
            <div>not found</div>
          )}
        </Match>

        <Match when={props.query.data}>
          {props.children(
            props.query.data as Exclude<T, null | false | undefined>,
          )}
        </Match>
      </Switch>
    </Suspense>
  )
}
