import { useQueries } from "./useQueries.js";
import { defaultThrowOnError } from "./suspense.js";
function useSuspenseQueries(options, queryClient) {
  return useQueries(
    {
      ...options,
      queries: options.queries.map((query) => ({
        ...query,
        suspense: true,
        throwOnError: defaultThrowOnError,
        enabled: true
      }))
    },
    queryClient
  );
}
export {
  useSuspenseQueries
};
//# sourceMappingURL=useSuspenseQueries.js.map
