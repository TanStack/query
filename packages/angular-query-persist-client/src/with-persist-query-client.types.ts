import type { PersistQueryClientOptions as PersistQueryClientOptionsCore } from '@tanstack/query-persist-client-core'

export type PersistQueryClientUserOptions = {
  persistOptions: Omit<PersistQueryClientOptionsCore, 'queryClient'>
  onSuccess?: () => Promise<unknown> | unknown
  onError?: () => Promise<unknown> | unknown
}

export interface WithPersistQueryClientOptions {
  deps?: Array<any>
}

export type WithPersistQueryClientFn = (
  ...deps: Array<any>
) => PersistQueryClientUserOptions
