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
import type { PersistQueryClientFeature } from '@tanstack/angular-query-experimental'
import type {
  PersistQueryClientUserOptions,
  WithPersistQueryClientFn,
  WithPersistQueryClientOptions,
} from './with-persist-query-client.types'

export type {
  PersistQueryClientUserOptions,
  WithPersistQueryClientFn,
  WithPersistQueryClientOptions,
} from './with-persist-query-client.types'

function resolvePersistOptions(
  input: PersistQueryClientUserOptions | WithPersistQueryClientFn,
  withOptions: WithPersistQueryClientOptions | undefined,
  injectDep: <T>(token: any) => T,
): PersistQueryClientUserOptions {
  if (typeof input === 'function') {
    const deps = withOptions?.deps ?? []
    const depValues = deps.map((token) => injectDep(token))
    return input(...depValues)
  }
  return input
}

/**
 * Enables persistence.
 *
 * **Example**
 *
 * ```ts
 * const localStoragePersister = createAsyncStoragePersister({
 *  storage: window.localStorage,
 * })
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     ...provideTanStackQuery(
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
  factoryOrOptions: WithPersistQueryClientFn,
  withOptions?: WithPersistQueryClientOptions,
): PersistQueryClientFeature
export function withPersistQueryClient(
  options: PersistQueryClientUserOptions,
): PersistQueryClientFeature
export function withPersistQueryClient(
  factoryOrOptions:
    | PersistQueryClientUserOptions
    | WithPersistQueryClientFn,
  withOptions?: WithPersistQueryClientOptions,
): PersistQueryClientFeature {
  const isRestoring = signal(true)
  return queryFeature('PersistQueryClient', [
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

        const { onSuccess, onError, persistOptions } = resolvePersistOptions(
          factoryOrOptions,
          withOptions,
          inject,
        )
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
      },
    },
  ])
}
