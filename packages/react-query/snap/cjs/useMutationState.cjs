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
function useIsMutating(filters, queryClient) {
  const client = QueryClientProvider.useQueryClient(queryClient);
  return useMutationState(
    { filters: { ...filters, status: "pending" } },
    client
  ).length;
}
function getResult(mutationCache, options) {
  return mutationCache.findAll(options.filters).map(
    (mutation) => options.select ? options.select(
      mutation
    ) : mutation.state
  );
}
function useMutationState(options = {}, queryClient) {
  const mutationCache = QueryClientProvider.useQueryClient(queryClient).getMutationCache();
  const optionsRef = React__namespace.useRef(options);
  const result = React__namespace.useRef();
  if (!result.current) {
    result.current = getResult(mutationCache, options);
  }
  React__namespace.useEffect(() => {
    optionsRef.current = options;
  });
  return React__namespace.useSyncExternalStore(
    React__namespace.useCallback(
      (onStoreChange) => mutationCache.subscribe(() => {
        const nextResult = queryCore.replaceEqualDeep(
          result.current,
          getResult(mutationCache, optionsRef.current)
        );
        if (result.current !== nextResult) {
          result.current = nextResult;
          queryCore.notifyManager.schedule(onStoreChange);
        }
      }),
      [mutationCache]
    ),
    () => result.current,
    () => result.current
  );
}
exports.useIsMutating = useIsMutating;
exports.useMutationState = useMutationState;
//# sourceMappingURL=useMutationState.cjs.map
