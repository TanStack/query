---
id: QueryClientProvider
title: QueryClientProvider
---

Use the `QueryClientProvider` component to connect and provide a `QueryClient` to your application:

```js
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'

const queryCache = new QueryCache()
const queryClient = new QueryClient({ queryCache })

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```
