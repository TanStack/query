---
id: query-cancellation
title: Query Cancellation
---

By default, queries that unmount or become unused before their promises are resolved are simply ignored instead of canceled. Why is this?

- For most applications, ignoring out-of-date queries is sufficient.
- Cancellation APIs may not be available for every query function.
- If cancellation APIs are available, they typically vary in implementation between utilities/libraries (eg. Fetch vs Axios vs XMLHttpRequest).

But don't worry! If your queries are high-bandwidth or potentially very expensive to download, React Query exposes a generic way to **cancel** query requests using a cancellation token or other related API. To integrate with this feature, attach a `cancel` function to the promise returned by your query that implements your request cancellation. When a query becomes out-of-date or inactive, this `promise.cancel` function will be called (if available):

## Using `axios`

```js
import { CancelToken } from 'axios'

const query = useQuery('todos', () => {
  // Create a new CancelToken source for this request
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

## Using `fetch`

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

## Manual Cancellation

You might want to cancel a query manually. For example, if the request takes a long time to finish, you can allow the user to click a cancel button to stop the request. To do this, you just need to call `queryClient.cancelQueries(key)`. If `promise.cancel` is available, React Query will cancel the request.

```js
const [queryKey] = useState('todos')

const query = useQuery(queryKey, () => {
  const controller = new AbortController()
  const signal = controller.signal

  const promise = fetch('/todos', {
    method: 'get',
    signal,
  })

  // Cancel the request if React Query calls the `promise.cancel` method
  promise.cancel = () => controller.abort()

  return promise
})

const queryClient = useQueryClient();

return (
  <button onClick={(e) => {
    e.preventDefault();
    queryClient.cancelQueries(queryKey);
   }}>Cancel</button>
)
```
