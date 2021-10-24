---
id: query-cancellation
title: Query Cancellation
---

[_Previous method requiring a `cancel` function_](#old-cancel-function)

React Query provide each query function with an [`AbortSignal` instance](https://developer.mozilla.org/docs/Web/API/AbortSignal). When a query becomes out-of-date or inactive, this `signal` will become aborted. This means that all queries are cancellable and you can respond to the cancellation inside your query function if desired. The best part about this is that it allow you to continue to use normal async/await syntax while getting all the benefits of automatic cancellation.

## Using `fetch`

```js
const query = useQuery('todos', async ({ signal }) =>
  fetch('/todos', {
    method: 'get',
    // Pass the signal to `fetch`
    signal,
  })
);
```

## Using `axios`

### Using `axios` [v0.22.0+](https://github.com/axios/axios/releases/tag/v0.22.0)

```js
import axios from 'axios'

const query = useQuery('todos', ({ signal }) =>
  axios.get('/todos', {
    // Pass the signal to `axios`
    signal,
  })
)
```

### Using an `axios` version less than v0.22.0

```js
import axios from 'axios'

const query = useQuery('todos', ({ signal }) => {
  // Create a new CancelToken source for this request
  const CancelToken = axios.CancelToken
  const source = CancelToken.source()

  const promise = axios.get('/todos', {
    // Pass the source token to your request
    cancelToken: source.token,
  })

  // Cancel the request if React Query signals to abort
  signal.onabort = () => {
    source.cancel('Query was cancelled by React Query')
  }

  return promise
})
```

## Using `XMLHttpRequest`

```js
const query = useQuery('todos', ({ signal }) => {
  return new Promise((resolve, reject) => {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', () => {
      resolve(JSON.parse(oReq.responseText));
    });
    signal.addEventListener('abort', () => {
      oReq.abort();
      reject();
    });
    oReq.open('GET', '/todos');
    oReq.send();
  });
});
```

## Manual Cancellation

You might want to cancel a query manually. For example, if the request takes a long time to finish, you can allow the user to click a cancel button to stop the request. To do this, you just need to call `queryClient.cancelQueries(key)` and React Query will cancel the request.

```js
const [queryKey] = useState('todos')

const query = useQuery(queryKey, ({ signal }) =>
  fetch('/todos', {
    method: 'get',
    signal,
  })
)

const queryClient = useQueryClient();

return (
  <button onClick={(e) => {
    e.preventDefault();
    queryClient.cancelQueries(queryKey);
   }}>Cancel</button>
)
```

## Old `cancel` function

Don't worry! The previous cancellation functionality will continue to work. But we do recommend that you move away from [the withdrawn cancelable promise proposal](https://github.com/tc39/proposal-cancelable-promises) to the [new `AbortSignal` interface](#_top) which has been [stardardized](https://dom.spec.whatwg.org/#interface-abortcontroller) as a general purpose construct for aborting ongoing activities in [most browsers](https://caniuse.com/abortcontroller) and in [Node](https://nodejs.org/api/globals.html#globals_class_abortsignal).

To integrate with this feature, attach a `cancel` function to the promise returned by your query that implements your request cancellation. When a query becomes out-of-date or inactive, this `promise.cancel` function will be called (if available). Also note that if you attach a `cancel` function to the promise that the `AbortSignal` provided to the query function will **not** become aborted. Using this method opts you out from the newer `AbortSignal` method.

## Using `axios` with `cancel` function

```js
import axios from 'axios'

const query = useQuery('todos', () => {
  // Create a new CancelToken source for this request
  const CancelToken = axios.CancelToken
  const source = CancelToken.source()

  const promise = axios.get('/todos', {
    // Pass the source token to your request
    cancelToken: source.token,
  })

  // Cancel the request if React Query calls the `promise.cancel` method
  promise.cancel = () => {
    source.cancel('Query was cancelled by React Query')
  }

  return promise
})
```

## Using `fetch` with `cancel` function

```js
const query = useQuery('todos', () => {
  // Create a new AbortController instance for this request
  const controller = new AbortController()
  // Get the abortController's signal
  const signal = controller.signal

  const promise = fetch('/todos', {
    method: 'get',
    // Pass the signal to your request
    signal,
  })

  // Cancel the request if React Query calls the `promise.cancel` method
  promise.cancel = () => controller.abort()

  return promise
})
```
