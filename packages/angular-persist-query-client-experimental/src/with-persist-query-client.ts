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
 *  providers: [
 *    provideTanStackQuery(
 *      new QueryClient(),
 *      withPersistQueryClient([
 *        {
 *          persistOptions: {
 *            persister: localStoragePersister,
 *          },
 *          onSuccess: () => console.log('Restoration completed successfully.'),
 *        },
 *      ])
 *    )
 *  ]
 * }
 * ```
 * @param persistQueryClientOptions - An array of objects containing persistOptions and an onSuccess callback which gets called when the restoration process is complete.
 * @returns A set of providers for use with `provideTanStackQuery`.
 * @public
 */
export function withPersistQueryClient(
  persistQueryClientOptions: Array<PersistQueryClientOptions>,
): PersistQueryClientFeature {
  const isRestoring = signal(false)
  const providers = [
    provideIsRestoring(isRestoring.asReadonly()),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        if (!isPlatformBrowser(inject(PLATFORM_ID))) return
        const destroyRef = inject(DestroyRef)
        const queryClient = inject(QueryClient)

        isRestoring.set(true)
        const restorations = persistQueryClientOptions.map(
          ({ onSuccess, persistOptions }) => {
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
  ]
  return queryFeature('PersistQueryClient', providers)
}
