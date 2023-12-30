"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const useQueries = require("./useQueries.cjs");
const suspense = require("./suspense.cjs");
function useSuspenseQueries(options, queryClient) {
  return useQueries.useQueries(
    {
      ...options,
      queries: options.queries.map((query) => ({
        ...query,
        suspense: true,
        throwOnError: suspense.defaultThrowOnError,
        enabled: true
      }))
    },
    queryClient
  );
}
exports.useSuspenseQueries = useSuspenseQueries;
//# sourceMappingURL=useSuspenseQueries.cjs.map
