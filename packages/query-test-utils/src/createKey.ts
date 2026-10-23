let keyCount = 0

/**
 * Creates a key that no other call returns, to use as a `queryKey` or
 * `mutationKey` so tests don't share cache entries.
 * @returns A new key like `['key-1']`.
 */
export const createKey = (): Array<string> => {
  keyCount++
  return [`key-${keyCount}`]
}
