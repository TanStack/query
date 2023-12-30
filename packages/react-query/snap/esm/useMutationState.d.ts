import type { DefaultError, Mutation, MutationFilters, MutationState, QueryClient } from '@tanstack/query-core';
export declare function useIsMutating(filters?: MutationFilters, queryClient?: QueryClient): number;
type MutationStateOptions<TResult = MutationState> = {
    filters?: MutationFilters;
    select?: (mutation: Mutation<unknown, DefaultError, unknown, unknown>) => TResult;
};
export declare function useMutationState<TResult = MutationState>(options?: MutationStateOptions<TResult>, queryClient?: QueryClient): Array<TResult>;
export {};
//# sourceMappingURL=useMutationState.d.ts.map