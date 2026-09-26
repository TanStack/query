---
id: disabling-queries
title: Disabling/Pausing Queries
ref: docs/framework/react/guides/disabling-queries.md
replace: { 'useQuery': 'injectQuery' }
---

[//]: # 'Example'

```angular-ts
@Component({
  selector: 'todos',
  template: `<div>
    <button (click)="todosQuery.refetch()">Fetch Todos</button>

    @if (todosQuery.data()) {
      <ul>
        @for (todo of todosQuery.data(); track todo.id) {
          <li>{{ todo.title }}</li>
        }
      </ul>
    } @else {
      @if (todosQuery.isError()) {
        <span>Error: {{ todosQuery.error().message }}</span>
      } @else if (todosQuery.isLoading()) {
        <span>Loading...</span>
      } @else if (!todosQuery.isLoading() && !todosQuery.isError()) {
        <span>Not ready ...</span>
      }
    }

    <div>{{ todosQuery.isLoading() ? 'Fetching...' : '' }}</div>
  </div>`,
})
export class TodosComponent {
  readonly todosQuery = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
    enabled: false,
  }))
}
```

[//]: # 'Example'
[//]: # 'Example2'

```angular-ts
@Component({
  selector: 'todos',
  template: `
    <div>
      // 🚀 applying the filter will enable and execute the query
      <filters-form onApply="filter.set" />
      <todos-table data="todosQuery.data()" />
    </div>
  `,
})
export class TodosComponent {
  filter = signal('')

  readonly todosQuery = injectQuery(() => ({
    queryKey: ['todos', this.filter()],
    queryFn: () => fetchTodos(this.filter()),
    enabled: !!this.filter(),
  }))
}
```

[//]: # 'Example2'
[//]: # 'Example3'

```angular-ts
import { skipToken, injectQuery } from '@tanstack/angular-query-experimental'

@Component({
  selector: 'todos',
  template: `
    <div>
      // 🚀 applying the filter will enable and execute the query
      <filters-form onApply="filter.set" />
      <todos-table data="todosQuery.data()" />
    </div>
  `,
})
export class TodosComponent {
  filter = signal('')

  readonly todosQuery = injectQuery(() => ({
    queryKey: ['todos', this.filter()],
    queryFn: this.filter() ? () => fetchTodos(this.filter()) : skipToken,
  }))
}
```

[//]: # 'Example3'
