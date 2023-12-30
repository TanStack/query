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
const QueryClientContext = React__namespace.createContext(
  void 0
);
const useQueryClient = (queryClient) => {
  const client = React__namespace.useContext(QueryClientContext);
  if (queryClient) {
    return queryClient;
  }
  if (!client) {
    throw new Error("No QueryClient set, use QueryClientProvider to set one");
  }
  return client;
};
const QueryClientProvider = ({
  client,
  children
}) => {
  React__namespace.useEffect(() => {
    client.mount();
    return () => {
      client.unmount();
    };
  }, [client]);
  return /* @__PURE__ */ jsxRuntime.jsx(QueryClientContext.Provider, { value: client, children });
};
exports.QueryClientContext = QueryClientContext;
exports.QueryClientProvider = QueryClientProvider;
exports.useQueryClient = useQueryClient;
//# sourceMappingURL=QueryClientProvider.cjs.map
