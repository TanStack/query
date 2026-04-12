import { InjectionToken, makeStateKey, type StateKey } from '@angular/core'
import type { DehydratedState } from '@tanstack/query-core'

export const INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY =
  makeStateKey<DehydratedState>('tanstack-query-hydration-state')

export const INTERNAL_TANSTACK_QUERY_HYDRATION_TRANSFER_KEY = new InjectionToken<
  StateKey<DehydratedState>
>('tanstack-query-hydration-transfer-key', {
  providedIn: 'root',
  factory: () => INTERNAL_TANSTACK_QUERY_HYDRATION_STATE_KEY,
})
