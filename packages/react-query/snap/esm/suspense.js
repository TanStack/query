const defaultThrowOnError = (_error, query) => typeof query.state.data === "undefined";
const ensureStaleTime = (defaultedOptions) => {
  if (defaultedOptions.suspense) {
    if (typeof defaultedOptions.staleTime !== "number") {
      defaultedOptions.staleTime = 1e3;
    }
  }
};
const willFetch = (result, isRestoring) => result.isLoading && result.isFetching && !isRestoring;
const shouldSuspend = (defaultedOptions, result) => (defaultedOptions == null ? void 0 : defaultedOptions.suspense) && result.isPending;
const fetchOptimistic = (defaultedOptions, observer, errorResetBoundary) => observer.fetchOptimistic(defaultedOptions).catch(() => {
  errorResetBoundary.clearReset();
});
export {
  defaultThrowOnError,
  ensureStaleTime,
  fetchOptimistic,
  shouldSuspend,
  willFetch
};
//# sourceMappingURL=suspense.js.map
