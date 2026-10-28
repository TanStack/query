import { Show, createSignal, useTransition } from 'solid-js'
import Spinner from './Spinner'
import type { JSX } from 'solid-js'

export default function Button(props: {
  children: JSX.Element
  onClick: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [isStarted, setIsStarted] = createSignal(false)
  const isLoading = () => isStarted() && isPending()

  return (
    <button
      onClick={() => {
        setIsStarted(true)
        void startTransition(() => {
          props.onClick()
        }).then(() => setIsStarted(false))
      }}
      disabled={isLoading()}
    >
      {props.children}{' '}
      <Show when={isLoading()}>
        <Spinner />
      </Show>
    </button>
  )
}
