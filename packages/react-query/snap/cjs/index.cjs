"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const queryCore = require("@tanstack/query-core");
const useQueries = require("./useQueries.cjs");
const useQuery = require("./useQuery.cjs");
const useSuspenseQuery = require("./useSuspenseQuery.cjs");
const useSuspenseInfiniteQuery = require("./useSuspenseInfiniteQuery.cjs");
const useSuspenseQueries = require("./useSuspenseQueries.cjs");
const queryOptions = require("./queryOptions.cjs");
const infiniteQueryOptions = require("./infiniteQueryOptions.cjs");
const QueryClientProvider = require("./QueryClientProvider.cjs");
const HydrationBoundary = require("./HydrationBoundary.cjs");
const QueryErrorResetBoundary = require("./QueryErrorResetBoundary.cjs");
const useIsFetching = require("./useIsFetching.cjs");
const useMutationState = require("./useMutationState.cjs");
const useMutation = require("./useMutation.cjs");
const useInfiniteQuery = require("./useInfiniteQuery.cjs");
const isRestoring = require("./isRestoring.cjs");
exports.useQueries = useQueries.useQueries;
exports.useQuery = useQuery.useQuery;
exports.useSuspenseQuery = useSuspenseQuery.useSuspenseQuery;
exports.useSuspenseInfiniteQuery = useSuspenseInfiniteQuery.useSuspenseInfiniteQuery;
exports.useSuspenseQueries = useSuspenseQueries.useSuspenseQueries;
exports.queryOptions = queryOptions.queryOptions;
exports.infiniteQueryOptions = infiniteQueryOptions.infiniteQueryOptions;
exports.QueryClientContext = QueryClientProvider.QueryClientContext;
exports.QueryClientProvider = QueryClientProvider.QueryClientProvider;
exports.useQueryClient = QueryClientProvider.useQueryClient;
exports.HydrationBoundary = HydrationBoundary.HydrationBoundary;
exports.QueryErrorResetBoundary = QueryErrorResetBoundary.QueryErrorResetBoundary;
exports.useQueryErrorResetBoundary = QueryErrorResetBoundary.useQueryErrorResetBoundary;
exports.useIsFetching = useIsFetching.useIsFetching;
exports.useIsMutating = useMutationState.useIsMutating;
exports.useMutationState = useMutationState.useMutationState;
exports.useMutation = useMutation.useMutation;
exports.useInfiniteQuery = useInfiniteQuery.useInfiniteQuery;
exports.IsRestoringProvider = isRestoring.IsRestoringProvider;
exports.useIsRestoring = isRestoring.useIsRestoring;
Object.keys(queryCore).forEach((k) => {
  if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k))
    Object.defineProperty(exports, k, {
      enumerable: true,
      get: () => queryCore[k]
    });
});
//# sourceMappingURL=index.cjs.map
