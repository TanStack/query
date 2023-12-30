"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const queryCore = require("@tanstack/query-core");
const useBaseQuery = require("./useBaseQuery.cjs");
function useQuery(options, queryClient) {
  return useBaseQuery.useBaseQuery(options, queryCore.QueryObserver, queryClient);
}
exports.useQuery = useQuery;
//# sourceMappingURL=useQuery.cjs.map
