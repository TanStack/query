import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  inject,
  makeEnvironmentProviders,
} from '@angular/core'
import { provideQueryClient } from './inject-query-client'
import type { EnvironmentProviders } from '@angular/core'
import type { QueryClient } from '@tanstack/query-core'

export function provideAngularQuery(
  queryClient: QueryClient,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideQueryClient(queryClient),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        queryClient.mount()
        // Unmount the query client on application destroy
        inject(DestroyRef).onDestroy(() => queryClient.unmount())
      },
    },
  ])
}
