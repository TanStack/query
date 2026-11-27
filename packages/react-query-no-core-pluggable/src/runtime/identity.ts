/**
 * Returns its argument by reference. Option helpers specialize the signature with
 * their own overloads and add their key tags at compile time.
 * @param value - The original value.
 * @returns The original value.
 */
export function identity<T>(value: T): T {
  return value
}
