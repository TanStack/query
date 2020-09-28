---
id: QueryClientProvider
title: QueryClientProvider
---

Use the `QueryClientProvider` component to connect and provide a `QueryClient` to your application:

```js
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'

const cache = new QueryCache()
const client = new QueryClient({ cache })

function App() {
  return <QueryClientProvider client={client}>...</QueryClientProvider>
}
```
