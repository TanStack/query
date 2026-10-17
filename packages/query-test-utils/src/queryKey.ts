let queryKeyCount = 0

/**
 * Creates a query key that no other call returns, so tests don't share cache entries.
 * @returns A new key like `['query_1']`.
 */
export const queryKey = (): Array<string> => {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}
