function shouldThrowError(throwError, params) {
  if (typeof throwError === "function") {
    return throwError(...params);
  }
  return !!throwError;
}
export {
  shouldThrowError
};
//# sourceMappingURL=utils.js.map
