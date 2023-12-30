import * as React from "react";
import { QueriesObserver, notifyManager, QueryObserver } from "@tanstack/query-core";
import { useQueryClient } from "./QueryClientProvider.js";
import { useIsRestoring } from "./isRestoring.js";
import { useQueryErrorResetBoundary } from "./QueryErrorResetBoundary.js";
import { ensurePreventErrorBoundaryRetry, useClearResetErrorBoundary, getHasError } from "./errorBoundaryUtils.js";
import { ensureStaleTime, shouldSuspend, fetchOptimistic, willFetch } from "./suspense.js";
function useQueries({
  queries,
  ...options
}, queryClient) {
  const client = useQueryClient(queryClient);
  const isRestoring = useIsRestoring();
  const errorResetBoundary = useQueryErrorResetBoundary();
  const defaultedQueries = React.useMemo(
    () => queries.map((opts) => {
      const defaultedOptions = client.defaultQueryOptions(opts);
      defaultedOptions._optimisticResults = isRestoring ? "isRestoring" : "optimistic";
      return defaultedOptions;
    }),
    [queries, client, isRestoring]
  );
  defaultedQueries.forEach((query) => {
    ensureStaleTime(query);
    ensurePreventErrorBoundaryRetry(query, errorResetBoundary);
  });
  useClearResetErrorBoundary(errorResetBoundary);
  const [observer] = React.useState(
    () => new QueriesObserver(
      client,
      defaultedQueries,
      options
    )
  );
  const [optimisticResult, getCombinedResult, trackResult] = observer.getOptimisticResult(defaultedQueries);
  React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => isRestoring ? () => void 0 : observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer, isRestoring]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  React.useEffect(() => {
    observer.setQueries(
      defaultedQueries,
      options,
      {
        listeners: false
      }
    );
  }, [defaultedQueries, options, observer]);
  const shouldAtLeastOneSuspend = optimisticResult.some(
    (result, index) => shouldSuspend(defaultedQueries[index], result)
  );
  const suspensePromises = shouldAtLeastOneSuspend ? optimisticResult.flatMap((result, index) => {
    const opts = defaultedQueries[index];
    if (opts) {
      const queryObserver = new QueryObserver(client, opts);
      if (shouldSuspend(opts, result)) {
        return fetchOptimistic(opts, queryObserver, errorResetBoundary);
      } else if (willFetch(result, isRestoring)) {
        void fetchOptimistic(opts, queryObserver, errorResetBoundary);
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
      return getHasError({
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
export {
  useQueries
};
//# sourceMappingURL=useQueries.js.map
