import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { broadcastQueryClientRestore } from '@tanstack/query-broadcast-client-experimental'
import {
  QueryClient,
  provideIsRestoring,
  queryFeature,
} from '@tanstack/angular-query-experimental'
import type { BroadcastQueryClientRestoreOptions } from '@tanstack/query-broadcast-client-experimental'
import type { BroadcastQueryClientFeature } from '@tanstack/angular-query-experimental'

export type BroadcastQueryClientOptions = Omit<
  BroadcastQueryClientRestoreOptions,
  'queryClient'
>

/**
 * Enables cross-tab bootstrap and live synchronization.
 *
 * The restore signal remains active until the bounded bootstrap promise
 * settles, preventing injectQuery and injectQueries from fetching an empty
 * cache during initialization.
 * @param broadcastOptions - Options for the broadcast restore session.
 * @returns A feature for use with provideTanStackQuery.
 */
export function withBroadcastQueryClient(
  broadcastOptions: BroadcastQueryClientOptions,
): BroadcastQueryClientFeature {
  const isRestoring = signal(true)
  const providers = [
    provideIsRestoring(isRestoring.asReadonly()),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        if (!isPlatformBrowser(inject(PLATFORM_ID))) {
          isRestoring.set(false)
          return
        }

        const destroyRef = inject(DestroyRef)
        const queryClient = inject(QueryClient)
        const [cleanup, restorePromise] = broadcastQueryClientRestore({
          ...broadcastOptions,
          queryClient,
        })

        restorePromise.then(() => {
          isRestoring.set(false)
        })
        destroyRef.onDestroy(cleanup)
      },
    },
  ]

  return queryFeature('BroadcastQueryClient', providers)
}
