import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'
import { projectsMockInterceptor } from './api/projects-mock.interceptor'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideAngularQuery(new QueryClient()),
    provideHttpClient(withInterceptors([projectsMockInterceptor]), withFetch()),
  ],
}
