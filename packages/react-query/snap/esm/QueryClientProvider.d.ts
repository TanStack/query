import * as React from 'react';
import type { QueryClient } from '@tanstack/query-core';
export declare const QueryClientContext: React.Context<QueryClient | undefined>;
export declare const useQueryClient: (queryClient?: QueryClient) => QueryClient;
export type QueryClientProviderProps = {
    client: QueryClient;
    children?: React.ReactNode;
};
export declare const QueryClientProvider: ({ client, children, }: QueryClientProviderProps) => JSX.Element;
//# sourceMappingURL=QueryClientProvider.d.ts.map