---
id: testing
title: Testing
---

React Query works by means of hooks - either the ones we offer or custom ones that wrap around them.

With React 17 or earlier, writing unit tests for these custom hooks can be done by means of the [React Hooks Testing Library](https://react-hooks-testing-library.com/) library.

Install this by running:

```sh
npm install @testing-library/react-hooks react-test-renderer --save-dev
```

(The `react-test-renderer` library is needed as a peer dependency of `@testing-library/react-hooks`, and needs to correspond to the version of React that you are using.)

_Note_: when using React 18 or later, `renderHook` is available directly through the `@testing-library/react` package, and `@testing-library/react-hooks` is no longer required.

## Our First Test

Once installed, a simple test can be written. Given the following custom hook:

```tsx
export function useCustomHook() {
  return useQuery({ queryKey: ['customHook'], queryFn: () => 'Hello' })
}
```

We can write a test for this as follows:

```tsx
import { renderHook, waitFor } from '@testing-library/react'

const queryClient = new QueryClient()
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const { result } = renderHook(() => useCustomHook(), { wrapper })

await waitFor(() => expect(result.current.isSuccess).toBe(true))

expect(result.current.data).toEqual('Hello')
```

Note that we provide a custom wrapper that builds the `QueryClient` and `QueryClientProvider`. This helps to ensure that our test is completely isolated from any other tests.

It is possible to write this wrapper only once, but if so we need to ensure that the `QueryClient` gets cleared before every test, and that tests don't run in parallel otherwise one test will influence the results of others.

## Turn off retries

The library defaults to three retries with exponential backoff, which means that your tests are likely to timeout if you want to test an erroneous query. The easiest way to turn retries off is via the QueryClientProvider. Let's extend the above example:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ turns retries off
      retry: false,
    },
  },
})
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)
```

This will set the defaults for all queries in the component tree to "no retries". It is important to know that this will only work if your actual useQuery has no explicit retries set. If you have a query that wants 5 retries, this will still take precedence, because defaults are only taken as a fallback.

## Set gcTime to Infinity with Jest

If you use Jest, you can set the `gcTime` to `Infinity` to prevent "Jest did not exit one second after the test run completed" error message. This is the default behavior on the server, and is only necessary to set if you are explicitly setting a `gcTime`.

## Testing Network Calls

The primary use for React Query is to cache network requests, so it's important that we can test our code is making the correct network requests in the first place.

There are plenty of ways that these can be tested, but for this example we are going to use [nock](https://www.npmjs.com/package/nock).

Given the following custom hook:

```tsx
function useFetchData() {
  return useQuery({
    queryKey: ['fetchData'],
    queryFn: () => request('/api/data'),
  })
}
```

We can write a test for this as follows:

```tsx
const queryClient = new QueryClient()
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const expectation = nock('http://example.com').get('/api/data').reply(200, {
  answer: 42,
})

const { result } = renderHook(() => useFetchData(), { wrapper })

await waitFor(() => expect(result.current.isSuccess).toBe(true))

expect(result.current.data).toEqual({ answer: 42 })
```

Here we are making use of `waitFor` and waiting until the query status indicates that the request has succeeded. This way we know that our hook has finished and should have the correct data. _Note_: when using React 18, the semantics of `waitFor` have changed as noted above.

## Testing Load More / Infinite Scroll

First we need to mock our API response

```tsx
function generateMockedResponse(page) {
  return {
    page: page,
    items: [...]
  }
}
```

Then, our `nock` configuration needs to differentiate responses based on the page, and we'll be using `uri` to do this.
`uri`'s value here will be something like `"/?page=1` or `/?page=2`

```tsx
const expectation = nock('http://example.com')
  .persist()
  .query(true)
  .get('/api/data')
  .reply(200, (uri) => {
    const url = new URL(`http://example.com${uri}`)
    const { page } = Object.fromEntries(url.searchParams)
    return generateMockedResponse(page)
  })
```

(Notice the `.persist()`, because we'll be calling from this endpoint multiple times)

Now we can safely run our tests, the trick here is to await for the data assertion to pass:

```tsx
const { result } = renderHook(() => useInfiniteQueryCustomHook(), {
  wrapper,
})

await waitFor(() => expect(result.current.isSuccess).toBe(true))

expect(result.current.data.pages).toStrictEqual(generateMockedResponse(1))

result.current.fetchNextPage()

await waitFor(() =>
  expect(result.current.data.pages).toStrictEqual([
    ...generateMockedResponse(1),
    ...generateMockedResponse(2),
  ]),
)

expectation.done()
```

_Note_: when using React 18, the semantics of `waitFor` have changed as noted above.

## Further reading

For additional tips and an alternative setup using `mock-service-worker`, have a look at [Testing React Query](../community/tkdodos-blog.md#5-testing-react-query) from
the Community Resources.
