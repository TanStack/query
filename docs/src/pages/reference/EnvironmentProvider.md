---
id: EnvironmentProvider
title: EnvironmentProvider
---

Use the `EnvironmentProvider` component to connect and provide an `Environment` to your application:

```js
import { Environment, EnvironmentProvider, QueryCache } from 'react-query'

const environment = new Environment({
  queryCache: new QueryCache(),
})

function App() {
  return (
    <EnvironmentProvider environment={environment}>...</EnvironmentProvider>
  )
}
```
