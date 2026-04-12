import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { vi } from 'vitest'
import { provideTanStackQuery } from '@tanstack/angular-query-experimental'
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
      provideTanStackQuery(queryClient),
      ...(options.providers ?? []),
    ],
  })
}

export async function flushQueryUpdates() {
  await vi.advanceTimersByTimeAsync(0)
}
