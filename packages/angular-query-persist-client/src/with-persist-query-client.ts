import { QueryClient } from '@tanstack/angular-query'
import {
  DestroyRef,
  InjectionToken,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
} from '@angular/core'
import {
  provideIsRestoring,
  queryFeature,
} from '@tanstack/angular-query/internal'
import { isPlatformBrowser } from '@angular/common'
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import type { WritableSignal } from '@angular/core'
import type { QueryFeature } from '@tanstack/angular-query'
import type { WithPersistQueryClientFn } from './with-persist-query-client.types'

const RESTORING_STATE = new InjectionToken<WritableSignal<boolean>>(
  'Query restoration state',
)

export type {
  PersistQueryClientUserOptions,
  WithPersistQueryClientFn,
} from './with-persist-query-client.types'

/**
 * Enables persistence. The options factory runs once per injector, only in the
 * browser, in an Angular injection context. It can call `inject()` and use
 * browser APIs such as `localStorage`.
 *
 * ```ts
 * withPersistQueryClient(() => ({
 *   persistOptions: {
 *     persister: createAsyncStoragePersister({ storage: localStorage }),
 *   },
 * }))
 * ```
 *
 * @param optionsFactory - Creates the persistence options in the browser.
 * @returns A set of providers for use with `provideTanStackQuery`.
 * @public
 */
export function withPersistQueryClient(
  optionsFactory: WithPersistQueryClientFn,
): QueryFeature {
  return queryFeature(
    makeEnvironmentProviders([
      { provide: RESTORING_STATE, useFactory: () => signal(true) },
      provideIsRestoring(() => inject(RESTORING_STATE).asReadonly()),
      provideEnvironmentInitializer(() => {
        const isRestoring = inject(RESTORING_STATE)
        if (!isPlatformBrowser(inject(PLATFORM_ID))) {
          isRestoring.set(false)
          return
        }
        const destroyRef = inject(DestroyRef)
        const queryClient = inject(QueryClient)

        const { onSuccess, onError, persistOptions } = optionsFactory()
        const options = { queryClient, ...persistOptions }
        void persistQueryClientRestore(options)
          .then(() => {
            return onSuccess?.()
          })
          .catch(() => {
            return onError?.()
          })
          .finally(() => {
            if (destroyRef.destroyed) return
            isRestoring.set(false)
            const cleanup = persistQueryClientSubscribe(options)
            destroyRef.onDestroy(cleanup)
          })
      }),
    ]),
  )
}
