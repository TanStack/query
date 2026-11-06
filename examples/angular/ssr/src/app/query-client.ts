import { isPlatformServer } from '@angular/common'
import { PLATFORM_ID, inject } from '@angular/core'
import { QueryClient } from '@tanstack/angular-query'

export const SHARED_QUERY_DEFAULTS = {
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 60 * 24,
} as const

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        ...SHARED_QUERY_DEFAULTS,
        ...(isPlatformServer(inject(PLATFORM_ID)) ? { retry: false } : {}),
      },
    },
  })
}
