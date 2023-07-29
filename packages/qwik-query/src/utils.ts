import { type QueryClient, dehydrate } from "@tanstack/query-core"

export const queryClientState = (queryClient: QueryClient) => dehydrate(queryClient);  