import type { ApplicationConfig } from '@angular/core'
import { provideClientHydration, withEventReplay } from '@angular/platform-browser'
import {
  QueryClient,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'
import { withDevtools } from '@tanstack/angular-query-devtools'

export const sharedQueryDefaults = {
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 60 * 24,
} as const

export const createBrowserQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { ...sharedQueryDefaults },
    },
  })

export const getBaseAppConfig = (queryClient: QueryClient): ApplicationConfig => {
  return {
    providers: [
      provideClientHydration(withEventReplay()),
      provideTanStackQuery(queryClient, withDevtools()),
    ],
  }
}

export const getClientAppConfig = (): ApplicationConfig =>
  getBaseAppConfig(createBrowserQueryClient())
