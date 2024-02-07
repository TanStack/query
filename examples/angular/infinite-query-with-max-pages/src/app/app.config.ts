import { provideHttpClient, withFetch } from '@angular/common/http'
import { ApplicationConfig } from '@angular/core'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
          },
        },
      }),
    ),
  ],
}
