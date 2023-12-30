"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const queryCore = require("@tanstack/query-core");
const QueryClientProvider = require("./QueryClientProvider.cjs");
const utils = require("./utils.cjs");
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
function useMutation(options, queryClient) {
  const client = QueryClientProvider.useQueryClient(queryClient);
  const [observer] = React__namespace.useState(
    () => new queryCore.MutationObserver(
      client,
      options
    )
  );
  React__namespace.useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);
  const result = React__namespace.useSyncExternalStore(
    React__namespace.useCallback(
      (onStoreChange) => observer.subscribe(queryCore.notifyManager.batchCalls(onStoreChange)),
      [observer]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  const mutate = React__namespace.useCallback(
    (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop);
    },
    [observer]
  );
  if (result.error && utils.shouldThrowError(observer.options.throwOnError, [result.error])) {
    throw result.error;
  }
  return { ...result, mutate, mutateAsync: result.mutate };
}
function noop() {
}
exports.useMutation = useMutation;
//# sourceMappingURL=useMutation.cjs.map
