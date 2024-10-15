import {
  provideAngularQuery,
  provideIsRestoring,
} from '@tanstack/angular-query-experimental'
import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core'
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'

import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import type { QueryClient } from '@tanstack/angular-query-experimental'

/**
 * Configures the Query client and registers one or more persisters.
 *
 * This function:
 * - Sets up the query client using provideAngularQuery
 * - Registers one or more persisters
 * - Manages the restore state
 *
 * **Example**
 * ```ts
 * import { QueryClient } from '@tanstack/angular-query-experimental'
 * import { providePersistAngularQuery } from '@tanstack/angular-query-persist-client-experimental'
 * import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
 *
 * const persister = createSyncStoragePersister({
 * storage: window.localStorage,
 * })
 *
 * bootstrapApplication(AppComponent, {
 * providers: [providePersistAngularQuery(new QueryClient(), [{ persister }])],
 * })
 * ```
 * @param queryClient - A `QueryClient` instance.
 * @param persistOptions - An array of objects to configure multiple persisters.
 * @returns Providers for TanStack Query with persistence.
 * @public
 */
export function providePersistAngularQuery(
  queryClient: QueryClient,
  persistOptions: Array<
    Omit<PersistQueryClientOptions, 'queryClient'> & {
      onSuccess?: () => Promise<unknown> | unknown
    }
  >,
) {
  const isRestoring = signal(false)

  return makeEnvironmentProviders([
    provideAngularQuery(queryClient),
    provideIsRestoring(() => isRestoring.asReadonly()),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const destroyRef = inject(DestroyRef)
        isRestoring.set(true)
        const restorations = persistOptions.map(
          ({ onSuccess, ...persistOptions }) => {
            const options = { queryClient, ...persistOptions }
            return persistQueryClientRestore(options).then(async () => {
              try {
                if (onSuccess) {
                  await onSuccess()
                }
              } finally {
                const cleanup = persistQueryClientSubscribe(options)
                destroyRef.onDestroy(cleanup)
              }
            })
          },
        )
        Promise.all(restorations).finally(() => {
          isRestoring.set(false)
        })
      },
    },
  ])
}
