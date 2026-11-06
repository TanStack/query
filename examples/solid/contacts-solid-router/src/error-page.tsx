import { createEffect } from 'solid-js'

export default function ErrorPage(props: { error: unknown }) {
  createEffect(() => console.error(props.error))

  const errorMessage = () =>
    props.error instanceof Error ? props.error.message : ''

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{errorMessage()}</i>
      </p>
    </div>
  )
}
