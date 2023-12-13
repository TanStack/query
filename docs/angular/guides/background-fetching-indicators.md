---
id: background-fetching-indicators
title: Background Fetching Indicators
ref: docs/react/guides/background-fetching-indicators.md
---

[//]: # 'Example'

```ts
@Component({
  selector: 'posts',
  template: `
    @switch (query.status()) {
      @case ('pending') {
        Loading...
      }
      @case ('error') {
        An error has occurred: {{ query.error()?.message }}
      }
      @default {
        @if (query.isFetching()) {
          Refreshing...
        }
        @for (todo of query.data()) {
          <todo [todo]="todo" />
        }
      }
    }
  `,
})
export class TodosComponent {
  todosQuery = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  }))
}
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
import { injectIsFetching } from '@tanstack/angular-query-experimental'

@Component({
  selector: 'global-loading-indicator',
  template: `@if (isFetching()) {
    <div>Queries are fetching in the background...</div>
  }`,
})
export class GlobalLoadingIndicatorComponent {
  isFetching = injectIsFetching()
}
```

[//]: # 'Example2'
