---
id: suspense
title: Suspense
---

React Query can also be used with React's Suspense for Data Fetching API's. To enable this mode, you can set either the global or query level config's `suspense` option to `true`.

Global configuration:

```tsx
// Configure for all queries
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
    },
  },
})

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}
```

Query configuration:

```tsx
import { useQuery } from '@tanstack/react-query'

// Enable for an individual query
useQuery({ queryKey, queryFn, suspense: true })
```

When using suspense mode, `status` states and `error` objects are not needed and are then replaced by usage of the `React.Suspense` component (including the use of the `fallback` prop and React error boundaries for catching errors). Please read the [Resetting Error Boundaries](#resetting-error-boundaries) and look at the [Suspense Example](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/main/examples/react/suspense) for more information on how to set up suspense mode.

In addition to queries behaving differently in suspense mode, mutations also behave a bit differently. By default, instead of supplying the `error` variable when a mutation fails, it will be thrown during the next render of the component it's used in and propagate to the nearest error boundary, similar to query errors. If you wish to disable this, you can set the `throwOnError` option to `false`. If you wish that errors are not thrown at all, you can set the `throwOnError` option to `false` as well!

## Resetting Error Boundaries

Whether you are using **suspense** or **throwOnError** in your queries, you will need a way to let queries know that you want to try again when re-rendering after some error occurred.

Query errors can be reset with the `QueryErrorResetBoundary` component or with the `useQueryErrorResetBoundary` hook.

When using the component it will reset any query errors within the boundaries of the component:

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

const App: React.FC = () => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        onReset={reset}
        fallbackRender={({ resetErrorBoundary }) => (
          <div>
            There was an error!
            <Button onClick={() => resetErrorBoundary()}>Try again</Button>
          </div>
        )}
      >
        <Page />
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
)
```

When using the hook it will reset any query errors within the closest `QueryErrorResetBoundary`. If there is no boundary defined it will reset them globally:

```tsx
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

const App: React.FC = () => {
  const { reset } = useQueryErrorResetBoundary()
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <div>
          There was an error!
          <Button onClick={() => resetErrorBoundary()}>Try again</Button>
        </div>
      )}
    >
      <Page />
    </ErrorBoundary>
  )
}
```

## useSuspenseQuery

You can also use the dedicated `useSuspenseQuery` hook to enable suspense mode for a query:

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

const { data } = useSuspenseQuery({ queryKey, queryFn })
```

This has the same effect as setting the `suspense` option to `true` in the query config, but it works better in TypeScript, because `data` is guaranteed to be defined (as errors and loading states are handled by Suspense- and ErrorBoundaries).

On the flip side, you therefore can't conditionally enable / disable the Query. `placeholderData` also doesn't exist for this Query. To prevent the UI from being replaced by a fallback during an update, wrap your updates that change the QueryKey into [startTransition](https://react.dev/reference/react/Suspense#preventing-unwanted-fallbacks).

## Fetch-on-render vs Render-as-you-fetch

Out of the box, React Query in `suspense` mode works really well as a **Fetch-on-render** solution with no additional configuration. This means that when your components attempt to mount, they will trigger query fetching and suspend, but only once you have imported them and mounted them. If you want to take it to the next level and implement a **Render-as-you-fetch** model, we recommend implementing [Prefetching](../guides/prefetching) on routing callbacks and/or user interactions events to start loading queries before they are mounted and hopefully even before you start importing or mounting their parent components.

## Suspense on the Server with streaming

If you are using `NextJs`, you can use our **experimental** integration for Suspense on the Server: `@tanstack/react-query-next-experimental`. This package will allow you to fetch data on the server (in a client component) by just calling `useQuery` (with `suspense: true`) or `useSuspenseQuery` in your component. Results will then be streamed from the server to the client as SuspenseBoundaries resolve.

To achieve this, wrap your app in the `ReactQueryStreamedHydration` component:

```tsx
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'

export function Providers(props: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>
        {props.children}
      </ReactQueryStreamedHydration>
    </QueryClientProvider>
  )
}
```

For more information, check out the [NextJs Suspense Streaming Example](../examples/react/nextjs-suspense-streaming).

## Further reading

For tips on using suspense option, check the [Suspensive React Query Package](../community/suspensive-react-query) from the Community Resources.
