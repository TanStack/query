export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments; // @ts-ignore

    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};