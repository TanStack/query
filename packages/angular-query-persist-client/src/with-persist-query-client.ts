import {
  QueryClient,
  provideIsRestoring,
  queryFeature,
} from '@tanstack/angular-query-experimental'
import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import type { PersistQueryClientOptions as PersistQueryClientOptionsCore } from '@tanstack/query-persist-client-core'
import type { PersistQueryClientFeature } from '@tanstack/angular-query-experimental'

type PersistQueryClientOptions = {
  persistOptions: Omit<PersistQueryClientOptionsCore, 'queryClient'>
  onSuccess?: () => Promise<unknown> | unknown
  onError?: () => Promise<unknown> | unknown
}

/**
 * Enables persistence.
 *
 * **Example**
 *
 * ```ts
 * const localStoragePersister = createSyncStoragePersister({
 *  storage: window.localStorage,
 * })
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideTanStackQuery(
 *       new QueryClient(),
 *       withPersistQueryClient({
 *         persistOptions: {
 *           persister: localStoragePersister,
 *         },
 *         onSuccess: () => console.log('Restoration completed successfully.'),
 *       })
 *     ),
 *   ],
 * };
 * ```
 * @param persistQueryClientOptions - persistence options and optional onSuccess and onError callbacks which get called when the restoration process is complete.
 * @returns A set of providers for use with `provideTanStackQuery`.
 * @public
 */
export function withPersistQueryClient(
  persistQueryClientOptions: PersistQueryClientOptions,
): PersistQueryClientFeature {
  const isRestoring = signal(true)
  const providers = [
    provideIsRestoring(isRestoring.asReadonly()),
    {
      // Do not use provideEnvironmentInitializer while Angular < v19 is supported
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        if (!isPlatformBrowser(inject(PLATFORM_ID))) return
        const destroyRef = inject(DestroyRef)
        const queryClient = inject(QueryClient)

        const { onSuccess, onError, persistOptions } = persistQueryClientOptions
        const options = { queryClient, ...persistOptions }
        persistQueryClientRestore(options)
          .then(() => {
            onSuccess?.()
          })
          .catch(() => {
            onError?.()
          })
          .finally(() => {
            isRestoring.set(false)
            const cleanup = persistQueryClientSubscribe(options)
            destroyRef.onDestroy(cleanup)
          })
      },
    },
  ]
  return queryFeature('PersistQueryClient', providers)
}
