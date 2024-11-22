import { ApplicationConfig } from '@angular/core'
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental'

export const appConfig: ApplicationConfig = {
  providers: [provideTanStackQuery(new QueryClient())],
}
