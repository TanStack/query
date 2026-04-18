import { provideHttpClient, withFetch } from '@angular/common/http'
import type { ApplicationConfig } from '@angular/core'
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser'
import { provideTanStackQuery } from '@tanstack/angular-query-experimental'
import { withDevtools } from '@tanstack/angular-query-devtools'
import { QUERY_CLIENT } from './query-client'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    ...provideTanStackQuery(QUERY_CLIENT, withDevtools()),
  ],
}
