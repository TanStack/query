import { provideHttpClient, withFetch } from '@angular/common/http'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'

import { provideExperimentalZonelessChangeDetection } from '@angular/core'
import { routes } from './app.routes'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideAngularQuery(new QueryClient()),
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding()),
  ],
}
