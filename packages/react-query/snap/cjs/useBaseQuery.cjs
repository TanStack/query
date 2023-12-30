"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const queryCore = require("@tanstack/query-core");
const QueryErrorResetBoundary = require("./QueryErrorResetBoundary.cjs");
const QueryClientProvider = require("./QueryClientProvider.cjs");
const isRestoring = require("./isRestoring.cjs");
const errorBoundaryUtils = require("./errorBoundaryUtils.cjs");
const suspense = require("./suspense.cjs");
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
function useBaseQuery(options, Observer, queryClient) {
  if (process.env.NODE_ENV !== "production") {
    if (typeof options !== "object" || Array.isArray(options)) {
      throw new Error(
        'Bad argument type. Starting with v5, only the "Object" form is allowed when calling query related functions. Please use the error stack to find the culprit call. More info here: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#supports-a-single-signature-one-object'
      );
    }
  }
  const client = QueryClientProvider.useQueryClient(queryClient);
  const isRestoring$1 = isRestoring.useIsRestoring();
  const errorResetBoundary = QueryErrorResetBoundary.useQueryErrorResetBoundary();
  const defaultedOptions = client.defaultQueryOptions(options);
  defaultedOptions._optimisticResults = isRestoring$1 ? "isRestoring" : "optimistic";
  suspense.ensureStaleTime(defaultedOptions);
  errorBoundaryUtils.ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary);
  errorBoundaryUtils.useClearResetErrorBoundary(errorResetBoundary);
  const [observer] = React__namespace.useState(
    () => new Observer(
      client,
      defaultedOptions
    )
  );
  const result = observer.getOptimisticResult(defaultedOptions);
  React__namespace.useSyncExternalStore(
    React__namespace.useCallback(
      (onStoreChange) => {
        const unsubscribe = isRestoring$1 ? () => void 0 : observer.subscribe(queryCore.notifyManager.batchCalls(onStoreChange));
        observer.updateResult();
        return unsubscribe;
      },
      [observer, isRestoring$1]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  React__namespace.useEffect(() => {
    observer.setOptions(defaultedOptions, { listeners: false });
  }, [defaultedOptions, observer]);
  if (suspense.shouldSuspend(defaultedOptions, result)) {
    observer.setOptions(defaultedOptions, { listeners: false });
    throw suspense.fetchOptimistic(defaultedOptions, observer, errorResetBoundary);
  }
  if (errorBoundaryUtils.getHasError({
    result,
    errorResetBoundary,
    throwOnError: defaultedOptions.throwOnError,
    query: observer.getCurrentQuery()
  })) {
    throw result.error;
  }
  return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
}
exports.useBaseQuery = useBaseQuery;
//# sourceMappingURL=useBaseQuery.cjs.map
