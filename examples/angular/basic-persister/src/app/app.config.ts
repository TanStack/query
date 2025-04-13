import { provideHttpClient, withFetch } from '@angular/common/http'
import {
  QueryClient,
  provideTanStackQuery,
  withDevtools,
} from '@tanstack/angular-query-experimental'
import { withPersistQueryClient } from '@tanstack/angular-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import type { ApplicationConfig } from '@angular/core'

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
})

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideTanStackQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minute
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
          },
        },
      }),
      withDevtools(),
      withPersistQueryClient({
        persistOptions: {
          persister: localStoragePersister,
        },
      }),
    ),
  ],
}
