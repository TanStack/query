"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const queryCore = require("@tanstack/query-core");
const useBaseQuery = require("./useBaseQuery.cjs");
function useInfiniteQuery(options, queryClient) {
  return useBaseQuery.useBaseQuery(
    options,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    queryCore.InfiniteQueryObserver,
    queryClient
  );
}
exports.useInfiniteQuery = useInfiniteQuery;
//# sourceMappingURL=useInfiniteQuery.cjs.map
