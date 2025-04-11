import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http'
import {
  QueryClient,
  provideTanStackQuery,
  withDevtools,
} from '@tanstack/angular-query-experimental'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { withPersistQueryClient } from '@tanstack/angular-query-persist-client-experimental'
import { mockInterceptor } from './interceptor/mock-api.interceptor'
import type { ApplicationConfig } from '@angular/core'

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
})

const sessionStoragePersister = createSyncStoragePersister({
  storage: window.sessionStorage,
})

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([mockInterceptor])),
    provideTanStackQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
          },
        },
      }),
      withDevtools(),
      withPersistQueryClient([
        {
          persistOptions: {
            persister: localStoragePersister,
            dehydrateOptions: {
              shouldDehydrateQuery: (query) =>
                query.state.status === 'success' &&
                query.queryKey[0] === 'preferences',
            },
          },
        },
        {
          persistOptions: {
            persister: sessionStoragePersister,
            dehydrateOptions: {
              shouldDehydrateQuery: (query) =>
                query.state.status === 'success' &&
                query.queryKey[0] === 'session',
            },
          },
        },
      ]),
    ),
  ],
}
