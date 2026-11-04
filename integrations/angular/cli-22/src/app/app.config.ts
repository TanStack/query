import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core'
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental'
import { withDevtools } from '@tanstack/angular-query-experimental/devtools'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideTanStackQuery(new QueryClient(), withDevtools()),
  ],
}
