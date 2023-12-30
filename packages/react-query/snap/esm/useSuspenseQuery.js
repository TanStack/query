import { QueryObserver } from "@tanstack/query-core";
import { useBaseQuery } from "./useBaseQuery.js";
import { defaultThrowOnError } from "./suspense.js";
function useSuspenseQuery(options, queryClient) {
  return useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      throwOnError: defaultThrowOnError
    },
    QueryObserver,
    queryClient
  );
}
export {
  useSuspenseQuery
};
//# sourceMappingURL=useSuspenseQuery.js.map
