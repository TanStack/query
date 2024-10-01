import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'
import { autocompleteMockInterceptor } from './api/autocomplete-mock.interceptor'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
          },
        },
      }),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([autocompleteMockInterceptor]),
    ),
  ],
}
