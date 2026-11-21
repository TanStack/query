import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <p id="zero-state">
      This is a demo for integrating TanStack Router with TanStack Query.
      <br />
      Check out{' '}
      <a href="https://tanstack.com/router/latest/docs/">
        the TanStack Router docs
      </a>{' '}
      and{' '}
      <a href="https://tanstack.com/query/v5/docs/">the docs at tanstack.com</a>
      .
    </p>
  )
}
