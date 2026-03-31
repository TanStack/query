import type { PersistQueryClientOptions as PersistQueryClientOptionsCore } from '@tanstack/query-persist-client-core'

/**
 * Options passed to {@link withPersistQueryClient} (static shape).
 */
export type PersistQueryClientUserOptions = {
  persistOptions: Omit<PersistQueryClientOptionsCore, 'queryClient'>
  onSuccess?: () => Promise<unknown> | unknown
  onError?: () => Promise<unknown> | unknown
}

/**
 * Options for the factory form of {@link withPersistQueryClient}.
 */
export interface WithPersistQueryClientOptions {
  /**
   * Dependencies injected and passed as arguments to `factory`, in order.
   * The factory runs only in the browser (after `isPlatformBrowser`), so it is safe to touch `window` / `localStorage`, etc.
   */
  deps?: Array<any>
}

export type WithPersistQueryClientFn = (
  ...deps: Array<any>
) => PersistQueryClientUserOptions
