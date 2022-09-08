import type { QueryClient } from "@tanstack/query-core";
import { Component, Context, createContext, useContext, JSX, onMount, onCleanup } from "solid-js";
import { ContextOptions } from "./types";

declare global {
  interface Window {
    SolidQueryClientContext?: Context<QueryClient | undefined>
  }
}

export const QueryClientContext = createContext<QueryClient>();
export const QueryClientSharingContext = createContext<boolean>(false)

interface Props {
  client: QueryClient;
  children: JSX.Element;
}

// Simple Query Client Context Provider
export const QueryClientProvider: Component<Props> = (props) => {
  if (!props.client) {
    throw new Error("No queryClient found.");
  }

  onMount(() => props.client.mount());
  onCleanup(() => props.client.unmount());

  return (
    <QueryClientContext.Provider value={props.client}>
      {props.children}
    </QueryClientContext.Provider>
  );
};

function getQueryClientContext(
  context: Context<QueryClient | undefined> | undefined,
  contextSharing: boolean
) {
  if (context) {
    return context;
  }

  if (contextSharing && typeof window !== 'undefined') {
    if (!window.SolidQueryClientContext) {
      window.SolidQueryClientContext = QueryClientContext;
    }

    return window.SolidQueryClientContext
  }

  return QueryClientContext
}

export const useQueryClient = ({ context }: ContextOptions = {}) => {
  const queryClient = useContext(
    getQueryClientContext(context, useContext(QueryClientSharingContext))
  );

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one');
  }
  
  return queryClient;
};
