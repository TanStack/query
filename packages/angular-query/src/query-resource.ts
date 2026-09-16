import { computed, untracked } from '@angular/core'
import type { QueryObserverResult } from '@tanstack/query-core'
import type { ResourceSnapshot } from './utils/resource-types'
import type { Resource, ResourceStatus, Signal } from '@angular/core'

export interface QueryResource<TValue> extends Resource<TValue> {
  /**
   * The current query state as a single snapshot.
   */
  readonly snapshot: Signal<ResourceSnapshot<TValue>>

  /**
   * Requests a new query fetch only when the current query data is stale.
   *
   * Used for compatibility with Angular APIs that might want to reload a resource,
   * like Signal Forms' validateAsync resource interface.
   *
   * @returns `true` if a reload was initiated, `false` if a reload was unnecessary or unsupported.
   */
  reload: () => boolean
}

type QueryResourceSource<TValue> = {
  readonly data: Signal<TValue>
  readonly status: Signal<QueryObserverResult['status']>
  readonly fetchStatus: Signal<QueryObserverResult['fetchStatus']>
  readonly error: Signal<unknown>
  readonly isStale: Signal<boolean>
  readonly refetch: () => unknown
}

/**
 * Converts an Angular Query result into Angular's Resource interface.
 *
 * Call this function once and reuse the returned resource.
 *
 * @param query An Angular Query or infinite-query result.
 * @returns A Resource-compatible view of the query result.
 */
export function toResource<TValue>(
  query: QueryResourceSource<TValue>,
): QueryResource<TValue> {
  // Intentionally does not use resource from snapshot to have
  // support for the reload method for compatible libraries
  const status = computed<ResourceStatus>(() => {
    const fetchStatus = query.fetchStatus()
    const data = query.data()

    if (fetchStatus === 'fetching' || fetchStatus === 'paused') {
      return data === undefined ? 'loading' : 'reloading'
    }

    switch (query.status()) {
      case 'success':
        return 'resolved'
      case 'error':
        return 'error'
      case 'pending':
        return 'idle'
    }
  })

  const error = computed<Error | undefined>(() => {
    return query.status() === 'error'
      ? normalizeError(query.error())
      : undefined
  })

  const value = computed(() => {
    if (status() === 'error') {
      throw error()
    }

    return query.data()
  })

  const snapshot = computed<ResourceSnapshot<TValue>>(() => {
    const currentStatus = status()

    if (currentStatus === 'error') {
      return { status: 'error', error: error()! }
    }

    return { status: currentStatus, value: query.data() }
  })

  const hasValue = (() =>
    status() !== 'error' &&
    query.data() !== undefined) as QueryResource<TValue>['hasValue']

  return {
    value,
    status,
    error,
    snapshot,
    isLoading: computed(() => {
      const currentStatus = status()
      return currentStatus === 'loading' || currentStatus === 'reloading'
    }),
    hasValue,
    reload(): boolean {
      const currentStatus = untracked(status)
      if (
        currentStatus === 'idle' ||
        currentStatus === 'loading' ||
        currentStatus === 'reloading'
      ) {
        return false
      }

      if (!untracked(query.isStale)) {
        return false
      }

      void query.refetch()
      return true
    },
  }
}

function normalizeError(error: unknown): Error {
  if (isErrorLike(error)) {
    return error
  }

  return new Error(String(error), { cause: error })
}

function isErrorLike(error: unknown): error is Error {
  return (
    error instanceof Error ||
    (typeof error === 'object' &&
      error !== null &&
      typeof (error as Error).name === 'string' &&
      typeof (error as Error).message === 'string')
  )
}
