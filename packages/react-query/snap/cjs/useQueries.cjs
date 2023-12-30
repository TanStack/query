"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const queryCore = require("@tanstack/query-core");
const QueryClientProvider = require("./QueryClientProvider.cjs");
const isRestoring = require("./isRestoring.cjs");
const QueryErrorResetBoundary = require("./QueryErrorResetBoundary.cjs");
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
function useQueries({
  queries,
  ...options
}, queryClient) {
  const client = QueryClientProvider.useQueryClient(queryClient);
  const isRestoring$1 = isRestoring.useIsRestoring();
  const errorResetBoundary = QueryErrorResetBoundary.useQueryErrorResetBoundary();
  const defaultedQueries = React__namespace.useMemo(
    () => queries.map((opts) => {
      const defaultedOptions = client.defaultQueryOptions(opts);
      defaultedOptions._optimisticResults = isRestoring$1 ? "isRestoring" : "optimistic";
      return defaultedOptions;
    }),
    [queries, client, isRestoring$1]
  );
  defaultedQueries.forEach((query) => {
    suspense.ensureStaleTime(query);
    errorBoundaryUtils.ensurePreventErrorBoundaryRetry(query, errorResetBoundary);
  });
  errorBoundaryUtils.useClearResetErrorBoundary(errorResetBoundary);
  const [observer] = React__namespace.useState(
    () => new queryCore.QueriesObserver(
      client,
      defaultedQueries,
      options
    )
  );
  const [optimisticResult, getCombinedResult, trackResult] = observer.getOptimisticResult(defaultedQueries);
  React__namespace.useSyncExternalStore(
    React__namespace.useCallback(
      (onStoreChange) => isRestoring$1 ? () => void 0 : observer.subscribe(queryCore.notifyManager.batchCalls(onStoreChange)),
      [observer, isRestoring$1]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  React__namespace.useEffect(() => {
    observer.setQueries(
      defaultedQueries,
      options,
      {
        listeners: false
      }
    );
  }, [defaultedQueries, options, observer]);
  const shouldAtLeastOneSuspend = optimisticResult.some(
    (result, index) => suspense.shouldSuspend(defaultedQueries[index], result)
  );
  const suspensePromises = shouldAtLeastOneSuspend ? optimisticResult.flatMap((result, index) => {
    const opts = defaultedQueries[index];
    if (opts) {
      const queryObserver = new queryCore.QueryObserver(client, opts);
      if (suspense.shouldSuspend(opts, result)) {
        return suspense.fetchOptimistic(opts, queryObserver, errorResetBoundary);
      } else if (suspense.willFetch(result, isRestoring$1)) {
        void suspense.fetchOptimistic(opts, queryObserver, errorResetBoundary);
      }
    }
    return [];
  }) : [];
  if (suspensePromises.length > 0) {
    observer.setQueries(
      defaultedQueries,
      options,
      {
        listeners: false
      }
    );
    throw Promise.all(suspensePromises);
  }
  const observerQueries = observer.getQueries();
  const firstSingleResultWhichShouldThrow = optimisticResult.find(
    (result, index) => {
      var _a;
      return errorBoundaryUtils.getHasError({
        result,
        errorResetBoundary,
        throwOnError: ((_a = defaultedQueries[index]) == null ? void 0 : _a.throwOnError) ?? false,
        query: observerQueries[index]
      });
    }
  );
  if (firstSingleResultWhichShouldThrow == null ? void 0 : firstSingleResultWhichShouldThrow.error) {
    throw firstSingleResultWhichShouldThrow.error;
  }
  return getCombinedResult(trackResult());
}
exports.useQueries = useQueries;
//# sourceMappingURL=useQueries.cjs.map
