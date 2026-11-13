---
id: background-fetching-indicators
title: Background Fetching Indicators
ref: docs/framework/react/guides/background-fetching-indicators.md
replace:
  {
    'useIsFetching': 'injectIsFetching',
    'hook': 'function',
    '@tanstack/react-query': '@tanstack/angular-query',
  }
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
  readonly todosQuery = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  }))
}
```

[//]: # 'Example'
[//]: # 'Example2'

```angular-ts
import { injectIsFetching } from '@tanstack/angular-query'

@Component({
  selector: 'global-loading-indicator',
  template: `
    @if (isFetching()) {
      <div>Queries are fetching in the background...</div>
    }
  `,
})
export class GlobalLoadingIndicatorComponent {
  readonly isFetching = injectIsFetching()
}
```

[//]: # 'Example2'

## Reactive filters

Pass a factory when filtering activity. It can read signals or required component inputs:

```ts
readonly isFetching = injectIsFetching(() => ({ queryKey: ['todos', this.userId()] }))
readonly isMutating = injectIsMutating(() => ({ mutationKey: ['save', this.userId()] }))
```

The count updates when these dependencies change.
