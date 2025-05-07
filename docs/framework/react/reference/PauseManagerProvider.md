---
id: PauseManagerProvider
title: PauseManagerProvider
---

Use the `PauseManagerProvider` component to connect and provide a `PauseManager` to your application which is used to selectively disable updates:

```tsx
import { PauseManager, PauseManagerProvider } from '@tanstack/react-query'

const pauseManager = new PauseManager()

function App() {
  return <PauseManagerProvider client={pauseManager}>...</PauseManagerProvider>
}
```

**Options**

- `pauseManager: PauseManager`
  - **Required**
  - the PauseManager instance to provide
