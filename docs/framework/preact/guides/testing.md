---
id: testing
title: Testing
ref: docs/framework/react/guides/testing.md
replace: { 'react-query': 'preact-query', 'React': 'Preact' }
---

[//]: # 'Install'

Writing unit tests for these custom hooks can be done by means of the [Preact Testing Library](https://github.com/testing-library/preact-testing-library), which provides `renderHook` and re-exports the `@testing-library/dom` helpers such as `waitFor`.

Install this by running:

```sh
npm install @testing-library/preact --save-dev
```

[//]: # 'Install'
[//]: # 'ExampleFirstTest'

```tsx
import { renderHook, waitFor } from '@testing-library/preact'

const queryClient = new QueryClient()
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const { result } = renderHook(() => useCustomHook(), { wrapper })

await waitFor(() => expect(result.current.isSuccess).toBe(true))

expect(result.current.data).toEqual('Hello')
```

[//]: # 'ExampleFirstTest'
[//]: # 'NoteWaitFor1'

Here we are making use of `waitFor` and waiting until the query status indicates that the request has succeeded. This way we know that our hook has finished and should have the correct data.

[//]: # 'NoteWaitFor1'
[//]: # 'NoteWaitFor2'
[//]: # 'NoteWaitFor2'
