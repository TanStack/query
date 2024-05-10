---
id: QueryDefaultOptionsProvider
title: QueryDefaultOptionsProvider
---

Use the `QueryDefaultOptionsProvider` component to dynamically set the default options inside a component subtree.

```tsx
import React from 'react'
import { QueryDefaultOptionsProvider } from '@tanstack/react-query'

function App() {
  return (
    <QueryDefaultOptionsProvider
      // memoize the options object
      options={React.useMemo(
        () => ({ queries: { refetchInterval: 5000 } }),
        [],
      )}
    >
      ...
    </QueryDefaultOptionsProvider>
  )
}
```

**Options**

- `options: { queries: QueryObserverOptions }`
  - **Required**
  - the default options to set in this component subtree
