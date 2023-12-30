import type { UseMutationOptions, UseMutationResult } from './types';
import type { DefaultError, QueryClient } from '@tanstack/query-core';
export declare function useMutation<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(options: UseMutationOptions<TData, TError, TVariables, TContext>, queryClient?: QueryClient): UseMutationResult<TData, TError, TVariables, TContext>;
//# sourceMappingURL=useMutation.d.ts.map