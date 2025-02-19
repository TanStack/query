import type { DefaultError, MutationKey, MutationMeta, MutationOptions, MutationScope, QueryKey, QueryMeta, QueryOptions } from './types';
import type { QueryClient } from './queryClient';
import type { Query, QueryState } from './query';
import type { Mutation, MutationState } from './mutation';
type TransformerFn = (data: any) => any;
export interface DehydrateOptions {
    serializeData?: TransformerFn;
    shouldDehydrateMutation?: (mutation: Mutation) => boolean;
    shouldDehydrateQuery?: (query: Query) => boolean;
    shouldRedactErrors?: (error: unknown) => boolean;
}
export interface HydrateOptions {
    defaultOptions?: {
        deserializeData?: TransformerFn;
        queries?: QueryOptions;
        mutations?: MutationOptions<unknown, DefaultError, unknown, unknown>;
    };
}
interface DehydratedMutation {
    mutationKey?: MutationKey;
    state: MutationState;
    meta?: MutationMeta;
    scope?: MutationScope;
}
interface DehydratedQuery {
    queryHash: string;
    queryKey: QueryKey;
    state: QueryState;
    promise?: Promise<unknown>;
    meta?: QueryMeta;
}
export interface DehydratedState {
    mutations: Array<DehydratedMutation>;
    queries: Array<DehydratedQuery>;
}
export declare function defaultShouldDehydrateMutation(mutation: Mutation): boolean;
export declare function defaultShouldDehydrateQuery(query: Query): boolean;
export declare function defaultshouldRedactErrors(_: unknown): boolean;
export declare function dehydrate(client: QueryClient, options?: DehydrateOptions): DehydratedState;
export declare function hydrate(client: QueryClient, dehydratedState: unknown, options?: HydrateOptions): void;
export {};
//# sourceMappingURL=hydration.d.ts.map