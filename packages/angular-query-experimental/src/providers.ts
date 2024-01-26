import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  inject,
  makeEnvironmentProviders,
} from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { provideQueryClient } from './inject-query-client'
import type { EnvironmentProviders } from '@angular/core'

export function provideAngularQuery(): EnvironmentProviders
export function provideAngularQuery(
  queryClient: QueryClient,
): EnvironmentProviders
export function provideAngularQuery(
  queryClient?: QueryClient,
): EnvironmentProviders {
  const client = queryClient ?? new QueryClient()
  return makeEnvironmentProviders([
    provideQueryClient(client),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        client.mount()
        // Unmount the query client on application destroy
        inject(DestroyRef).onDestroy(() => client.unmount())
      },
    },
  ])
}
