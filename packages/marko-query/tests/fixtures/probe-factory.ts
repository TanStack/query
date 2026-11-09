import { QueryClient } from "@tanstack/marko-query";

export const createdClients: Array<QueryClient> = [];
export const createProbeClient = (): QueryClient => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: 1234 } },
  });
  createdClients.push(client);
  return client;
};
export function resetProbeFactory(): void {
  createdClients.length = 0;
}
