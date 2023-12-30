import * as React from "react";
const IsRestoringContext = React.createContext(false);
const useIsRestoring = () => React.useContext(IsRestoringContext);
const IsRestoringProvider = IsRestoringContext.Provider;
export {
  IsRestoringProvider,
  useIsRestoring
};
//# sourceMappingURL=isRestoring.js.map
