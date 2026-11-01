/**
 * Makes a client, like a `QueryClient`, clear its caches when it is disposed, for a test to hold
 * with `using`.
 * @param client - The client to clear on dispose.
 * @returns The same client, disposable.
 * @example
 * ```ts
 * it('fetches', async () => {
 *   using queryClient = clearOnDispose(new QueryClient())
 * })
 * ```
 */
export const clearOnDispose = <TClient extends { clear: () => void }>(
  client: TClient,
): TClient & Disposable =>
  Object.assign(client, {
    [Symbol.dispose]: () => {
      client.clear()
    },
  })
