import type { QueryClient } from '@tanstack/query-core'
import type { Readable } from 'svelte/store'
/** Retrieves a Client from Svelte's context */
export declare const getQueryClientContext: () => QueryClient
/** Sets a QueryClient on Svelte's context */
export declare const setQueryClientContext: (client: QueryClient) => void
/** Retrieves a `isRestoring` from Svelte's context */
export declare const getIsRestoringContext: () => Readable<boolean>
/** Sets a `isRestoring` on Svelte's context */
export declare const setIsRestoringContext: (
  isRestoring: Readable<boolean>,
) => void
//# sourceMappingURL=context.d.ts.map
