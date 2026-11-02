/**
 * Makes a rendered tree, like the result of Testing Library's `render`, unmount when it is
 * disposed, for a test to hold with `using`. Declared after the client it renders with, it
 * unmounts before that client is cleared.
 * @param rendered - The render result to unmount on dispose.
 * @returns The same render result, disposable.
 * @example
 * ```tsx
 * it('renders', () => {
 *   using queryClient = clearOnDispose(new QueryClient())
 *   using rendered = unmountOnDispose(renderWithClient(queryClient, <Page />))
 * })
 * ```
 */
export const unmountOnDispose = <TRendered extends { unmount: () => void }>(
  rendered: TRendered,
): TRendered & Disposable =>
  Object.assign(rendered, {
    [Symbol.dispose]: () => {
      rendered.unmount()
    },
  })
