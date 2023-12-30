"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const queryCore = require("@tanstack/query-core");
const useBaseQuery = require("./useBaseQuery.cjs");
const suspense = require("./suspense.cjs");
function useSuspenseQuery(options, queryClient) {
  return useBaseQuery.useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      throwOnError: suspense.defaultThrowOnError
    },
    queryCore.QueryObserver,
    queryClient
  );
}
exports.useSuspenseQuery = useSuspenseQuery;
//# sourceMappingURL=useSuspenseQuery.cjs.map
