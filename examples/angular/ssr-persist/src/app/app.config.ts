import { provideHttpClient, withFetch } from '@angular/common/http'
import type { ApplicationConfig } from '@angular/core'
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser'
import { provideTanStackQuery } from '@tanstack/angular-query-experimental'
import { withDevtools } from '@tanstack/angular-query-devtools'
import { withPersistQueryClient } from '@tanstack/angular-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PERSIST_STORAGE_KEY, QUERY_CLIENT } from './query-client'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    ...provideTanStackQuery(
      QUERY_CLIENT,
      withDevtools(),
      withPersistQueryClient(() => ({
        persistOptions: {
          persister: createAsyncStoragePersister({
            storage: localStorage,
            key: PERSIST_STORAGE_KEY,
            throttleTime: 1000,
          }),
        },
      })),
    ),
  ],
}
