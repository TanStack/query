import type { CreateMutationOptions, CreateMutationResult, StoreOrVal } from './types.js';
import type { DefaultError, QueryClient } from '@tanstack/query-core';
export declare function createMutation<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(options: StoreOrVal<CreateMutationOptions<TData, TError, TVariables, TContext>>, queryClient?: QueryClient): CreateMutationResult<TData, TError, TVariables, TContext>;
//# sourceMappingURL=createMutation.d.ts.map