"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const queryCore = require("@tanstack/query-core");
const QueryClientProvider = require("./QueryClientProvider.cjs");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const React__namespace = /* @__PURE__ */ _interopNamespaceDefault(React);
function useIsFetching(filters, queryClient) {
  const client = QueryClientProvider.useQueryClient(queryClient);
  const queryCache = client.getQueryCache();
  return React__namespace.useSyncExternalStore(
    React__namespace.useCallback(
      (onStoreChange) => queryCache.subscribe(queryCore.notifyManager.batchCalls(onStoreChange)),
      [queryCache]
    ),
    () => client.isFetching(filters),
    () => client.isFetching(filters)
  );
}
exports.useIsFetching = useIsFetching;
//# sourceMappingURL=useIsFetching.cjs.map
