import { provideHttpClient, withFetch } from '@angular/common/http'

import { provideRouter } from '@angular/router'
import {
  QueryClient,
  provideTanStackQuery,
  withDevtools,
} from '@tanstack/angular-query'
import { routes } from './app.routes'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(routes),
    provideTanStackQuery(new QueryClient(), withDevtools()),
  ],
}
