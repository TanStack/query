import { provideHttpClient, withFetch } from '@angular/common/http'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'
import { provideExperimentalZonelessChangeDetection } from '@angular/core'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideAngularQuery(new QueryClient()),
  ],
}
