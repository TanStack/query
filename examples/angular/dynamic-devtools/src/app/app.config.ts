import { provideHttpClient, withFetch } from '@angular/common/http'
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query'
import { withDevtools } from '@tanstack/angular-query-devtools/production'
import { inject } from '@angular/core'
import type { ApplicationConfig } from '@angular/core'
import { DevtoolsOptionsManager } from './devtools-options.manager'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideTanStackQuery(
      () => new QueryClient(),
      withDevtools(() => ({
        loadDevtools: inject(DevtoolsOptionsManager).loadDevtools,
      })),
    ),
  ],
}
