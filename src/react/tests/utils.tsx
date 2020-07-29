export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

/**
 * Checks that `T` is of type `U`.
 */
export type TypeOf<T, U> = Exclude<U, T> extends never ? true : false

/**
 * Checks that `T` is equal to `U`.
 */
export type TypeEqual<T, U> = Exclude<T, U> extends never
  ? Exclude<U, T> extends never
    ? true
    : false
  : false

/**
 * Assert the parameter is of a specific type.
 */
export const expectType = <T,>(_: T): void => undefined
