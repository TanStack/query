import { provideHttpClient, withFetch } from '@angular/common/http'
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser'
import { provideTanStackQuery } from '@tanstack/angular-query'
import { withDevtools } from '@tanstack/angular-query-devtools'
import { createQueryClient } from './query-client'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    provideTanStackQuery(createQueryClient, withDevtools()),
  ],
}
