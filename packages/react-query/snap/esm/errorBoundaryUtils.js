import * as React from "react";
import { shouldThrowError } from "./utils.js";
const ensurePreventErrorBoundaryRetry = (options, errorResetBoundary) => {
  if (options.suspense || options.throwOnError) {
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false;
    }
  }
};
const useClearResetErrorBoundary = (errorResetBoundary) => {
  React.useEffect(() => {
    errorResetBoundary.clearReset();
  }, [errorResetBoundary]);
};
const getHasError = ({
  result,
  errorResetBoundary,
  throwOnError,
  query
}) => {
  return result.isError && !errorResetBoundary.isReset() && !result.isFetching && shouldThrowError(throwOnError, [result.error, query]);
};
export {
  ensurePreventErrorBoundaryRetry,
  getHasError,
  useClearResetErrorBoundary
};
//# sourceMappingURL=errorBoundaryUtils.js.map
