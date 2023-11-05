import {
  ENVIRONMENT_INITIALIZER,
  inject,
  makeEnvironmentProviders,
} from '@angular/core'
import { QueryClientMounter } from './queryClientMounter'
import { provideQueryClient } from './injectQueryClient'
import type { EnvironmentProviders } from '@angular/core'
import type { QueryClient } from '@tanstack/query-core'

export function provideAngularQuery(
  queryClient: QueryClient,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideQueryClient(queryClient),
    QueryClientMounter,
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(QueryClientMounter)
      },
    },
  ])
}
