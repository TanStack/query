/**
 * Unmounts a render result, like one from Testing Library's `render`, when a test's `using`
 * declaration disposes it. Declare it after the client it renders with, so it unmounts before the
 * client clears.
 * @param rendered - The render result to unmount.
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
