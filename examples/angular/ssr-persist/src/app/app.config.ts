import type { ApplicationConfig } from '@angular/core'
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser'
import {
  QueryClient,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'
import { withDevtools } from '@tanstack/angular-query-devtools'
import { withPersistQueryClient } from '@tanstack/angular-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

/** Storage key for the persisted client cache (browser only). */
export const PERSIST_STORAGE_KEY = 'tanstack-query-angular-ssr-persist-example'

export const sharedQueryDefaults = {
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 60 * 24,
} as const

export const createBrowserQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { ...sharedQueryDefaults },
    },
  })

/**
 * Shared browser + server config. Extra TanStack Query features wrap the same client in browser
 * and SSR; persister setup only runs in the browser when using
 * {@link withPersistQueryClient}'s factory pattern.
 */
export const getBaseAppConfig = (
  queryClient: QueryClient,
): ApplicationConfig => {
  return {
    providers: [
      provideClientHydration(withEventReplay()),
      provideTanStackQuery(
        queryClient,
        withDevtools(),
        withPersistQueryClient(() => ({
          persistOptions: {
            persister: createAsyncStoragePersister({
              storage: localStorage,
              key: PERSIST_STORAGE_KEY,
              throttleTime: 1000,
            })
          },
        })),
      ),
    ],
  }
}

export const getClientAppConfig = (): ApplicationConfig =>
  getBaseAppConfig(createBrowserQueryClient())
