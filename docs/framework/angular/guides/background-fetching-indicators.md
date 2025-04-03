---
id: background-fetching-indicators
title: Background Fetching Indicators
ref: docs/framework/react/guides/background-fetching-indicators.md
---

[//]: # 'Example'

```angular-ts
@Component({
  selector: 'todos',
  template: `
    @if (todosQuery.isPending()) {
      Loading...
    } @else if (todosQuery.isError()) {
      An error has occurred: {{ todosQuery.error().message }}
    } @else if (todosQuery.isSuccess()) {
      @if (todosQuery.isFetching()) {
        Refreshing...
      }
      @for (todos of todosQuery.data(); track todo.id) {
        <todo [todo]="todo" />
      }
    }
  `,
})
class TodosComponent {
  todosQuery = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  }))
}
```

[//]: # 'Example'
[//]: # 'Example2'

```angular-ts
import { injectIsFetching } from '@tanstack/angular-query-experimental'

@Component({
  selector: 'global-loading-indicator',
  template: `
    @if (isFetching()) {
      <div>Queries are fetching in the background...</div>
    }
  `,
})
export class GlobalLoadingIndicatorComponent {
  isFetching = injectIsFetching()
}
```

[//]: # 'Example2'
