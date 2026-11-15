import { provideHttpClient, withFetch } from '@angular/common/http'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import {
  QueryClient,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'

import { withDevtools } from '@tanstack/angular-query-experimental/devtools'
import { routes } from './app.routes'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding()),
    provideTanStackQuery(new QueryClient(), withDevtools()),
  ],
}
