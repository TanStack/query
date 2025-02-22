import type { MutationState, QueryClient } from '@tanstack/query-core'
import type { Readable } from 'svelte/store'
import type { MutationStateOptions } from './types.js'
export declare function useMutationState<TResult = MutationState>(
  options?: MutationStateOptions<TResult>,
  queryClient?: QueryClient,
): Readable<Array<TResult>>
//# sourceMappingURL=useMutationState.d.ts.map
