---
id: suspense
title: Suspense
---

> NOTE: Suspense mode for React Query is experimental, same as Suspense for data fetching itself. These APIs WILL change and should not be used in production unless you lock both your React and React Query versions to patch-level versions that are compatible with each other.

React Query can also be used with React's new Suspense for Data Fetching API's. To enable this mode, you can set either the global or query level config's `suspense` option to `true`.

Global configuration:

```js
// Configure for all queries
import { ReactQueryConfigProvider } from 'react-query'

const queryConfig = {
  shared: {
    suspense: true,
  },
}

function App() {
  return (
    <ReactQueryConfigProvider config={queryConfig}>
      ...
    </ReactQueryConfigProvider>
  )
}
```

Query configuration:

```js
import { useQuery } from 'react-query'

// Enable for an individual query
useQuery(queryKey, queryFn, { suspense: true })
```

When using suspense mode, `status` states and `error` objects are not needed and are then replaced by usage of the `React.Suspense` component (including the use of the `fallback` prop and React error boundaries for catching errors). Please read the [Resetting Error Boundaries](#resetting-error-boundaries) and look at the [Suspense Example](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/suspense) for more information on how to set up suspense mode.

In addition to queries behaving differently in suspense mode, mutations also behave a bit differently. By default, instead of supplying the `error` variable when a mutation fails, it will be thrown during the next render of the component it's used in and propagate to the nearest error boundary, similar to query errors. If you wish to disable this, you can set the `useErrorBoundary` option to `false`. If you wish that errors are not thrown at all, you can set the `throwOnError` option to `false` as well!

## Resetting Error Boundaries

Whether you are using **suspense** or **useErrorBoundaries** in your queries, you will need to know how to use the `queryCache.resetErrorBoundaries` function to let queries know that you want them to try again when you render them again.

How you trigger this function is up to you, but the most common use case is to do it in something like `react-error-boundary`'s `onReset` callback:

```js
import { queryCache } from "react-query";
import { ErrorBoundary } from "react-error-boundary";

<ErrorBoundary
  onReset={() => queryCache.resetErrorBoundaries()}
  fallbackRender={({ error, resetErrorBoundary }) => (
    <div>
      There was an error!
      <Button onClick={() => resetErrorBoundary()}>Try again</Button>
    </div>
  )}
>
```

## Fetch-on-render vs Render-as-you-fetch

Out of the box, React Query in `suspense` mode works really well as a **Fetch-on-render** solution with no additional configuration. This means that when your components attempt to mount, they will trigger query fetching and suspend, but only once you have imported them and mounted them. If you want to take it to the next level and implement a **Render-as-you-fetch** model, we recommend implementing [Prefetching](#prefetching) on routing callbacks and/or user interactions events to start loading queries before they are mounted and hopefully even before you start importing or mounting their parent components.
