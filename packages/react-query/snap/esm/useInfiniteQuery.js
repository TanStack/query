import { InfiniteQueryObserver } from "@tanstack/query-core";
import { useBaseQuery } from "./useBaseQuery.js";
function useInfiniteQuery(options, queryClient) {
  return useBaseQuery(
    options,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    InfiniteQueryObserver,
    queryClient
  );
}
export {
  useInfiniteQuery
};
//# sourceMappingURL=useInfiniteQuery.js.map
