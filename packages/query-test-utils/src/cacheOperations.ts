/**
 * Selects this client's cache operations in the shared behavior and type tests.
 * The pluggable adapter supplies its named exports through the same fixture.
 * @param client - Client under test.
 * @returns The client's cache operations.
 */
export function cacheOperations<TClient>(client: TClient): TClient {
  return client
}
