import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideTanStackQuery } from '@tanstack/angular-query'
import type { QueryClient } from '@tanstack/query-core'
import type { EnvironmentProviders, Provider } from '@angular/core'

export function setupTanStackQueryTestBed(
  queryClient: QueryClient,
  options: { providers?: Array<Provider | EnvironmentProviders> } = {},
) {
  TestBed.resetTestingModule()
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideTanStackQuery(() => queryClient),
      ...(options.providers ?? []),
    ],
  })
}
