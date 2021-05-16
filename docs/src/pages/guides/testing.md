---
id: testing
title: Testing
---

React Query works by means of hooks - either the ones we offer or custom ones that wrap around them.

Writing unit tests for these custom hooks can be done by means of the [React Hooks Testing Library](https://react-hooks-testing-library.com/) library.

Install this by running:

```sh
npm install @testing-library/react-hooks react-test-renderer --save-dev
```

(The `react-test-renderer` library is needed as a peer dependency of `@testing-library/react-hooks`, and needs to correspond to the version of React that you are using.)

## Our First Test

Once installed, a simple test can be written. Given the following custom hook:

```
export function useCustomHook() {
  return useQuery('customHook', () => 'Hello');
}
```

We can write a test for this as follows:

```
const queryClient = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

const { result, waitFor } = renderHook(() => useCustomHook(), { wrapper });

await waitFor(() => result.current.isSuccess);

expect(result.current.data).toEqual("Hello");
```

Note that we provide a custom wrapper that builds the `QueryClient` and `QueryClientProvider`. This helps to ensure that our test is completely isolated from any other tests.

It is possible to write this wrapper only once, but if so we need to ensure that the `QueryClient` gets cleared before every test, and that tests don't run in parallel otherwise one test will influence the results of others.

## Testing Network Calls

The primary use for React Query is to cache network requests, so it's important that we can test our code is making the correct network requests in the first place.

There are plenty of ways that these can be tested, but for this example we are going to use [nock](https://www.npmjs.com/package/nock).

Given the following custom hook:

```
function useFetchData() {
  return useQuery('fetchData', () => request('/api/data'));
}
```

We can write a test for this as follows:

```
const queryClient = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

const expectation = nock('http://example.com')
  .get('/api/data')
  .reply(200, {
    answer: 42
  });

const { result, waitFor } = renderHook(() => useFetchData(), { wrapper });

await waitFor(() => {
  return result.current.isSuccess;
});

expect(result.current).toEqual({answer: 42});
```

Here we are making use of `waitFor` and waiting until our the query status indicates that the request has succeeded. This way we know that our hook has finished and should have the correct data.

## Testing Load More / Infinite Scroll

First we need to mock our API response

```
function generateMockedResponse(page) {
  return {
    page: page,
    items: [...]
  }
}
```

Then, our `nock` configuration needs to differentiate responses based on the page, and we'll be using `uri` to do this.
`uri`'s value here will be something like `"/?page=1` or `/?page=2`

```
const expectation = nock('http://example.com')
  .persist()
  .query(true)
  .get('/api/data')
  .reply(200, (uri) => {
    const url = new URL(`http://example.com${uri}`);
    const { page } = Object.fromEntries(url.searchParams);
    return generateMockedResponse(page);
  });
```

(Notice the `.persist()`, because we'll be calling from this endpoint multiple times)

Now we can safely run our tests, the trick here is to await both `isFetching` and then `!isFetching` after calling `fetchNextPage()`:

```
const { result, waitFor } = renderHook(() => useInfiniteQueryCustomHook(), { wrapper });

await waitFor(() => result.current.isSuccess);

expect(result.current.data.pages).toStrictEqual(generateMockedResponse(1));

result.current.fetchNextPage();

await waitFor(() => result.current.isFetching);
await waitFor(() => !result.current.isFetching);

expect(result.current.data.pages).toStrictEqual([
  ...generateMockedResponse(1),
  ...generateMockedResponse(2),
]);

expectation.done();
```
