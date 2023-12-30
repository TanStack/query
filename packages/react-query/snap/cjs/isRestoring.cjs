"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
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
const IsRestoringContext = React__namespace.createContext(false);
const useIsRestoring = () => React__namespace.useContext(IsRestoringContext);
const IsRestoringProvider = IsRestoringContext.Provider;
exports.IsRestoringProvider = IsRestoringProvider;
exports.useIsRestoring = useIsRestoring;
//# sourceMappingURL=isRestoring.cjs.map
