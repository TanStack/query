"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const queryCore = require("@tanstack/query-core");
const useBaseQuery = require("./useBaseQuery.cjs");
const suspense = require("./suspense.cjs");
function useSuspenseInfiniteQuery(options, queryClient) {
  return useBaseQuery.useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      throwOnError: suspense.defaultThrowOnError
    },
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    queryCore.InfiniteQueryObserver,
    queryClient
  );
}
exports.useSuspenseInfiniteQuery = useSuspenseInfiniteQuery;
//# sourceMappingURL=useSuspenseInfiniteQuery.cjs.map
