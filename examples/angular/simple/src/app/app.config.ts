import { provideHttpClient, withFetch } from '@angular/common/http'
import {
  QueryClient,
  provideTanStackQuery,
  withDevtools,
} from '@tanstack/angular-query-experimental'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideTanStackQuery(new QueryClient(), withDevtools()),
  ],
}
