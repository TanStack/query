import { provideHttpClient, withFetch } from '@angular/common/http'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import {
  QueryClient,
  provideTanStackQuery,
  withDeveloperTools,
} from '@tanstack/angular-query-experimental'

import { routes } from './app.routes'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideTanStackQuery(new QueryClient(), withDeveloperTools()),
    provideRouter(routes, withComponentInputBinding()),
  ],
}
