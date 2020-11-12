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
  const { data } = useQuery('customHook', () => 'Hello');
  return data;
}
```

We can write a test for this as follows:

```
const queryCache = new QueryCache();
const wrapper = ({ children }) => (
  <ReactQueryCacheProvider queryCache={queryCache}>
    {children}
  </ReactQueryCacheProvider>
);

const { result } = renderHook(() => useCustomHook(), { wrapper });

expect(result.current).toEqual('Hello');
```

Note that we provide a custom wrapper that builds the `QueryCache` and `ReactQueryCacheProvider`. This helps to ensure that our test is completely isolated from any other tests.

It is possible to write this wrapper only once, but if so we need to ensure that the `QueryCache` gets cleared before every test, and that tests don't run in parallel otherwise one test will influence the results of others.

## Testing Network Calls

The primary use for React Query is to cache network requests, so it's important that we can test our code is making the correct network requests in the first place.

There are plenty of ways that these can be tested, but for this example we are going to use [nock](https://www.npmjs.com/package/nock).

Given the following custom hook:

```
function useFetchData() {
  const { data } = useQuery('fetchData', () => request('/api/data'));
  return data;
}
```

We can write a test for this as follows:

```
const queryCache = new QueryCache();
const wrapper = ({ children }) => (
  <ReactQueryCacheProvider queryCache={queryCache}>
    {children}
  </ReactQueryCacheProvider>
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

Here we are making use of `waitFor` and waiting until our Nock expectation indicates that it has been called. This way we know that our hook has finished and should have the correct data.
