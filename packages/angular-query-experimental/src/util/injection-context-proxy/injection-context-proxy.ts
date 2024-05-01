import { runInInjectionContext } from "@angular/core";
import type { Injector } from "@angular/core";

export function injectionContextProxy<
  TInput extends Record<string | symbol, any>,
>(injector: Injector, input: TInput) {
  return new Proxy<TInput>({} as TInput, {
    get(target, prop) {
      // first check if we have it in our internal state and return it
      const computedField = target[prop];
      if (computedField) {
        return computedField;
      }

      const targetField = input[prop];
      if (typeof targetField === "function") {
        // @ts-expect-error
        return (target[prop] = (...args: Array<any>) =>
          runInInjectionContext(injector, () => targetField(...args)));
      }

      return targetField;
    },
    has(_, prop) {
      return !!input[prop];
    },
    ownKeys() {
      return Reflect.ownKeys(input);
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true,
      };
    },
  });
}
