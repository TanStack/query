import type { BootstrapContext } from '@angular/platform-browser'
import { mergeApplicationConfig } from '@angular/core'
import { provideServerRendering, withRoutes } from '@angular/ssr'
import { QueryClient } from '@tanstack/angular-query-experimental'
import { getBaseAppConfig, sharedQueryDefaults } from './app.config'
import { serverRoutes } from './app.routes.server'

const createServerQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        ...sharedQueryDefaults,
        retry: false,
      },
    },
  })

export const getServerConfig = (_context: BootstrapContext) =>
  mergeApplicationConfig(getBaseAppConfig(createServerQueryClient()), {
    providers: [provideServerRendering(withRoutes(serverRoutes))],
  })
