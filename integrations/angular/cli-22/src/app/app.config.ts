import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core'
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query'
import { withDevtools } from '@tanstack/angular-query-devtools'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideTanStackQuery(() => new QueryClient(), withDevtools()),
  ],
}
