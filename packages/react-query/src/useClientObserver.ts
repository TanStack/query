'use client'
import * as React from 'react'
import type { QueryClient } from '@tanstack/query-core'

/**
 * Returns an observer bound to `client`, creating a new one whenever the client changes.
 * The new observer is set in state during render, so a render that never commits leaves the
 * committed observer untouched.
 * @param client - The query client the observer must be bound to.
 * @param createObserver - Creates an observer for the client it is called with.
 * @returns The observer for `client`.
 */
export function useClientObserver<TObserver>(
  client: QueryClient,
  createObserver: (client: QueryClient) => TObserver,
): TObserver {
  const [observerState, setObserverState] = React.useState(() => ({
    client,
    observer: createObserver(client),
  }))

  const nextObserverState =
    observerState.client === client
      ? observerState
      : { client, observer: createObserver(client) }

  if (nextObserverState !== observerState) {
    setObserverState(nextObserverState)
  }

  return nextObserverState.observer
}
