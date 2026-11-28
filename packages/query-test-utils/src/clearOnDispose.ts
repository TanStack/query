/**
 * Clears a client, like a `QueryClient`, when a test's `using` declaration disposes it.
 * @param client - The client to clear.
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
