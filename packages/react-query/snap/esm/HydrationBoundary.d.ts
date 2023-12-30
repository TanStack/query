import * as React from 'react';
import type { HydrateOptions, QueryClient } from '@tanstack/query-core';
export interface HydrationBoundaryProps {
    state?: unknown;
    options?: Omit<HydrateOptions, 'defaultOptions'> & {
        defaultOptions?: Omit<HydrateOptions['defaultOptions'], 'mutations'>;
    };
    children?: React.ReactNode;
    queryClient?: QueryClient;
}
export declare const HydrationBoundary: ({ children, options, state, queryClient, }: HydrationBoundaryProps) => React.ReactElement<any, string | React.JSXElementConstructor<any>>;
//# sourceMappingURL=HydrationBoundary.d.ts.map