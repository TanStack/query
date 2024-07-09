import { provideZoneChangeDetection } from '@angular/core'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAngularQuery(new QueryClient()),
  ],
}
