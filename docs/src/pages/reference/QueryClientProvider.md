---
id: QueryClientProvider
title: QueryClientProvider
---

Use the `QueryClientProvider` component to connect and provide a `QueryClient` to your application:

```js
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```
**Options**

- `client: QueryClient`
  - **Required**
  - the QueryClient instance to provide
- `contextSharing: boolean`
  - defaults to `false`
  - Set this to `true` to enable context sharing, which will share the first and at least one instance of the context across the window  to ensure that if React Query is used across  different bundles or microfrontends they will  all use the same **instance** of context, regardless of module scoping.
