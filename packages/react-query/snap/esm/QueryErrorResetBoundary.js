import { jsx } from "react/jsx-runtime";
import * as React from "react";
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
const QueryErrorResetBoundaryContext = React.createContext(createValue());
const useQueryErrorResetBoundary = () => React.useContext(QueryErrorResetBoundaryContext);
const QueryErrorResetBoundary = ({
  children
}) => {
  const [value] = React.useState(() => createValue());
  return /* @__PURE__ */ jsx(QueryErrorResetBoundaryContext.Provider, { value, children: typeof children === "function" ? children(value) : children });
};
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary
};
//# sourceMappingURL=QueryErrorResetBoundary.js.map
