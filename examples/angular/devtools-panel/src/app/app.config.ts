import { provideHttpClient, withFetch } from '@angular/common/http'

import { provideRouter } from '@angular/router'
import { routes } from './app.routes'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  // In this example, `provideTanStackQuery` is used in the router
  providers: [provideHttpClient(withFetch()), provideRouter(routes)],
}
