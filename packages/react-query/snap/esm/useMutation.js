import * as React from "react";
import { MutationObserver, notifyManager } from "@tanstack/query-core";
import { useQueryClient } from "./QueryClientProvider.js";
import { shouldThrowError } from "./utils.js";
function useMutation(options, queryClient) {
  const client = useQueryClient(queryClient);
  const [observer] = React.useState(
    () => new MutationObserver(
      client,
      options
    )
  );
  React.useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);
  const result = React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  const mutate = React.useCallback(
    (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop);
    },
    [observer]
  );
  if (result.error && shouldThrowError(observer.options.throwOnError, [result.error])) {
    throw result.error;
  }
  return { ...result, mutate, mutateAsync: result.mutate };
}
function noop() {
}
export {
  useMutation
};
//# sourceMappingURL=useMutation.js.map
