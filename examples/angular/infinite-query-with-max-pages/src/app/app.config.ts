import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'
import { provideExperimentalZonelessChangeDetection } from '@angular/core'
import { projectsMockInterceptor } from './api/projects-mock.interceptor'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideHttpClient(withInterceptors([projectsMockInterceptor]), withFetch()),
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
