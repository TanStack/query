"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function shouldThrowError(throwError, params) {
  if (typeof throwError === "function") {
    return throwError(...params);
  }
  return !!throwError;
}
exports.shouldThrowError = shouldThrowError;
//# sourceMappingURL=utils.cjs.map
