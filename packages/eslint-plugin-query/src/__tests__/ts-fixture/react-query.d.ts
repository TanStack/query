// Ambient stub so type-checked tests can resolve `@tanstack/react-query`
// without adding it as a devDependency of this plugin.
declare module '@tanstack/react-query' {
  export type UseQueryResult<TData = unknown> = {
    data: TData | undefined
    isLoading: boolean
    isError: boolean
  }
  export function useQuery<TData>(options: {
    queryKey: ReadonlyArray<unknown>
    queryFn: () => Promise<TData>
  }): UseQueryResult<TData>
}
