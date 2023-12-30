import * as React from "react";
import { hydrate } from "@tanstack/query-core";
import { useQueryClient } from "./QueryClientProvider.js";
const HydrationBoundary = ({
  children,
  options = {},
  state,
  queryClient
}) => {
  const client = useQueryClient(queryClient);
  const [hydrationQueue, setHydrationQueue] = React.useState();
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  React.useMemo(() => {
    if (state) {
      if (typeof state !== "object") {
        return;
      }
      const queryCache = client.getQueryCache();
      const queries = state.queries || [];
      const newQueries = [];
      const existingQueries = [];
      for (const dehydratedQuery of queries) {
        const existingQuery = queryCache.get(dehydratedQuery.queryHash);
        if (!existingQuery) {
          newQueries.push(dehydratedQuery);
        } else {
          const hydrationIsNewer = dehydratedQuery.state.dataUpdatedAt > existingQuery.state.dataUpdatedAt;
          const queryAlreadyQueued = hydrationQueue == null ? void 0 : hydrationQueue.find(
            (query) => query.queryHash === dehydratedQuery.queryHash
          );
          if (hydrationIsNewer && (!queryAlreadyQueued || dehydratedQuery.state.dataUpdatedAt > queryAlreadyQueued.state.dataUpdatedAt)) {
            existingQueries.push(dehydratedQuery);
          }
        }
      }
      if (newQueries.length > 0) {
        hydrate(client, { queries: newQueries }, optionsRef.current);
      }
      if (existingQueries.length > 0) {
        setHydrationQueue(
          (prev) => prev ? [...prev, ...existingQueries] : existingQueries
        );
      }
    }
  }, [client, hydrationQueue, state]);
  React.useEffect(() => {
    if (hydrationQueue) {
      hydrate(client, { queries: hydrationQueue }, optionsRef.current);
      setHydrationQueue(void 0);
    }
  }, [client, hydrationQueue]);
  return children;
};
export {
  HydrationBoundary
};
//# sourceMappingURL=HydrationBoundary.js.map
