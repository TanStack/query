"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
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
function createValue() {
  let isReset = false;
  return {
    clearReset: () => {
      isReset = false;
    },
    reset: () => {
      isReset = true;
    },
    isReset: () => {
      return isReset;
    }
  };
}
const QueryErrorResetBoundaryContext = React__namespace.createContext(createValue());
const useQueryErrorResetBoundary = () => React__namespace.useContext(QueryErrorResetBoundaryContext);
const QueryErrorResetBoundary = ({
  children
}) => {
  const [value] = React__namespace.useState(() => createValue());
  return /* @__PURE__ */ jsxRuntime.jsx(QueryErrorResetBoundaryContext.Provider, { value, children: typeof children === "function" ? children(value) : children });
};
exports.QueryErrorResetBoundary = QueryErrorResetBoundary;
exports.useQueryErrorResetBoundary = useQueryErrorResetBoundary;
//# sourceMappingURL=QueryErrorResetBoundary.cjs.map
