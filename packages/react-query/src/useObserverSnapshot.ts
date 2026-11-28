'use client'
import { defaultQueryOptions, noop, notifyManager } from '@tanstack/query-core'
import * as React from 'react'
import { useIsRestoring } from './IsRestoringProvider'
import { useQueryClient } from './QueryClientProvider'
import type {
  QueryClient,
  QueryObserverOptions,
  QueryObserverResultReader,
} from '@tanstack/query-core'
import type { QueryRenderPolicy } from './queryDescriptor'

interface ObserverStore {
  subscribe: (listener: () => void) => () => void
}

/**
 * Selects the client and optimistic result mode for a React query reader.
 * @param queryClient - An explicit client, or the client from React context.
 * @param subscribed - Whether the reader wants live updates.
 * @returns The client and the optimistic mode, which also determines whether to subscribe.
 */
export function useReaderContext(
  queryClient?: QueryClient,
  subscribed?: boolean,
) {
  const client = useQueryClient(queryClient)
  const mode = useIsRestoring()
    ? 'isRestoring'
    : subscribed !== false
      ? 'optimistic'
      : undefined
  return { client, mode } as const
}

/**
 * Applies shared client defaults and the render policy selected for this observer.
 * @param client - The client from the reader's context.
 * @param options - The options supplied by the consumer.
 * @param mode - The result mode used before subscription.
 * @param policy - The optional Suspense behavior selected by the adapter.
 * @returns Observer options ready for the current render.
 */
export function defaultReaderOptions(
  client: QueryClient,
  options: QueryObserverOptions<any, any, any, any, any>,
  mode: ReturnType<typeof useReaderContext>['mode'],
  policy?: QueryRenderPolicy & {
    defaults?: Pick<
      QueryObserverOptions<any, any, any, any, any>,
      'enabled' | 'throwOnError'
    >
  },
) {
  const prepared = defaultQueryOptions(client, {
    ...options,
    ...policy?.defaults,
    suspense: !!policy?.suspense,
    _optimisticResults: mode,
  })
  policy?.prepare?.(prepared)
  return prepared
}

/**
 * Commits a reader and subscribes React to its cached snapshots.
 * @param observer - The observer that owns the subscription.
 * @param reader - The reader scoped to the current render options.
 * @param mode - Only the live optimistic reader subscribes to updates.
 * @param refresh - Includes updates that occurred before the subscription started.
 * @param onCommit - Clears the reset state when this render commits to a new error boundary.
 * @returns The current snapshot.
 */
export function useObserverSnapshot<TObserver extends ObserverStore, TResult>(
  observer: TObserver,
  reader: QueryObserverResultReader<TResult>,
  mode: ReturnType<typeof useReaderContext>['mode'],
  refresh: (observer: TObserver) => void,
  onCommit?: () => void,
): TResult {
  const subscribed = mode === 'optimistic'
  React.useEffect(() => onCommit?.(), [onCommit])
  React.useEffect(() => {
    reader.commit()
  }, [reader])

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        const unsubscribe = subscribed
          ? observer.subscribe(notifyManager.batchCalls(onStoreChange))
          : noop
        refresh(observer)
        return unsubscribe
      },
      [observer, subscribed, refresh],
    ),
    reader.getSnapshot,
    reader.getSnapshot,
  )
}
