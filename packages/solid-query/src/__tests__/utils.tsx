import { QueryClient, QueryClientProvider } from '..'
import { render } from 'solid-testing-library'
import {
  JSX,
  createEffect,
  createSignal,
  onCleanup,
  ParentProps,
  Show,
} from 'solid-js'

let queryKeyCount = 0
export function queryKey(): () => Array<string> {
  const localQueryKeyCount = queryKeyCount++
  return () => [`query_${localQueryKeyCount}`]
}

export function setActTimeout(fn: () => void, ms?: number) {
  return setTimeout(() => {
    fn()
  }, ms)
}

export function renderWithClient(
  client: QueryClient,
  ui: JSX.Element,
  // options: ContextOptions = {},
): ReturnType<typeof render> {
  // TODO(lukemurray): add support for context options
  // <QueryClientProvider client={client} context={options.context}>
  return render(() => (
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  ))
  // TODO(lukemurray): the react version returns rerender but the solid-testing-library
  // doesn't support rerender
  // return {
  //   ...result,
  //   rerender: (rerenderUi: React.ReactElement) =>
  //     rerender(
  //       <QueryClientProvider client={client} context={options.context}>
  //         {rerenderUi}
  //       </QueryClientProvider>,
  //     ),
  // } as any
}

export const Blink = (
  props: {
    duration: number
  } & ParentProps,
) => {
  const [shouldShow, setShouldShow] = createSignal<boolean>(true)

  createEffect(() => {
    setShouldShow(true)
    const timeout = setActTimeout(() => setShouldShow(false), props.duration)
    onCleanup(() => clearTimeout(timeout))
  })

  return (
    <Show when={shouldShow()} fallback={<>off</>}>
      <>{props.children}</>
    </Show>
  )
}
