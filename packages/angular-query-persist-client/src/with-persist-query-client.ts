import {
  QueryClient,
  provideIsRestoring,
  queryFeature,
} from '@tanstack/angular-query-experimental'
import {
  DestroyRef,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
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

/**
 * @param input - Static options object or factory callback
 * @param withOptions - When `input` is a function, optional `deps` for injection
 * @param injectDep - `inject` from the current initializer context
 * @returns Resolved persistence options
 */
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
 * **Example (static options)** — avoid browser-only globals at module scope when the same config runs on the server; prefer the factory form below for `localStorage`.
 *
 * ```ts
 * withPersistQueryClient({
 *   persistOptions: { persister },
 *   onSuccess: () => console.log('Restored.'),
 * })
 * ```
 *
 * **Example (factory, browser only, optional deps)** — same as `withDevtools`: the function runs only in the browser, so you can safely use `localStorage`.
 *
 * ```ts
 * withPersistQueryClient(() => ({
 *   persistOptions: {
 *     persister: createAsyncStoragePersister({ storage: localStorage }),
 *   },
 * }))
 * ```
 *
 * ```ts
 * withPersistQueryClient(
 *   (storage: StorageService) => ({
 *     persistOptions: { persister: storage.createPersister() },
 *   }),
 *   { deps: [StorageService] },
 * )
 * ```
 * @param factoryOrOptions - Either a callback (runs only in the browser) or a static options object.
 * @param withOptions - When using a callback, optional `deps` passed as arguments (like `useFactory`).
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
/**
 * @param factoryOrOptions - See overload documentation.
 * @param withOptions - See overload documentation.
 * @returns Persist query client feature providers.
 */
export function withPersistQueryClient(
  factoryOrOptions:
    | PersistQueryClientUserOptions
    | WithPersistQueryClientFn,
  withOptions?: WithPersistQueryClientOptions,
): PersistQueryClientFeature {
  const isRestoring = signal(true)
  return queryFeature('PersistQueryClient', makeEnvironmentProviders([
    provideIsRestoring(isRestoring.asReadonly()),
    provideEnvironmentInitializer(() => {
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

      void persistQueryClientRestore(options).then(() => {
        return onSuccess?.()
      }).catch(() => {
        return onError?.()
      }).finally(() => {
        if (destroyRef.destroyed) return

        isRestoring.set(false)
        const cleanup = persistQueryClientSubscribe(options)
        destroyRef.onDestroy(cleanup)
      })
    }),
  ]))
}
