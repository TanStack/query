"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
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
const ensurePreventErrorBoundaryRetry = (options, errorResetBoundary) => {
  if (options.suspense || options.throwOnError) {
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false;
    }
  }
};
const useClearResetErrorBoundary = (errorResetBoundary) => {
  React__namespace.useEffect(() => {
    errorResetBoundary.clearReset();
  }, [errorResetBoundary]);
};
const getHasError = ({
  result,
  errorResetBoundary,
  throwOnError,
  query
}) => {
  return result.isError && !errorResetBoundary.isReset() && !result.isFetching && utils.shouldThrowError(throwOnError, [result.error, query]);
};
exports.ensurePreventErrorBoundaryRetry = ensurePreventErrorBoundaryRetry;
exports.getHasError = getHasError;
exports.useClearResetErrorBoundary = useClearResetErrorBoundary;
//# sourceMappingURL=errorBoundaryUtils.cjs.map
