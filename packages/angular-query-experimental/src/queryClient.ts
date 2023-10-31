import { InjectionToken } from '@angular/core'
import type { QueryClient } from '@tanstack/query-core'

/**
 * Injection token for the Angular Query client.
 */
export const QUERY_CLIENT = new InjectionToken<QueryClient>('QueryClient')
