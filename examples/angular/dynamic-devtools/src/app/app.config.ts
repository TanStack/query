import { provideHttpClient, withFetch } from '@angular/common/http'
import {
  QueryClient,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'
import { withDevtools } from '@tanstack/angular-query-devtools/production'
import type { ApplicationConfig } from '@angular/core'
import { DevtoolsOptionsManager } from './devtools-options.manager'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideTanStackQuery(
      new QueryClient(),
      withDevtools(
        (devToolsOptionsManager: DevtoolsOptionsManager) => ({
          loadDevtools: devToolsOptionsManager.loadDevtools(),
        }),
        {
          deps: [DevtoolsOptionsManager],
        },
      ),
    ),
  ],
}
