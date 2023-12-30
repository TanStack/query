"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
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
exports.defaultThrowOnError = defaultThrowOnError;
exports.ensureStaleTime = ensureStaleTime;
exports.fetchOptimistic = fetchOptimistic;
exports.shouldSuspend = shouldSuspend;
exports.willFetch = willFetch;
//# sourceMappingURL=suspense.cjs.map
