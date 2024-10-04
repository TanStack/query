import { provideHttpClient, withFetch } from '@angular/common/http'
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideAngularQuery(new QueryClient()),
    provideHttpClient(withFetch()),
  ],
}
