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
    <button (click)="query.refetch()">Fetch Todos</button>

    @if (query.data()) {
      <ul>
        @for (todo of query.data(); track todo.id) {
          <li>{{ todo.title }}</li>
        }
      </ul>
    } @else {
      @if (query.isError()) {
        <span>Error: {{ query.error().message }}</span>
      } @else if (query.isLoading()) {
        <span>Loading...</span>
      } @else if (!query.isLoading() && !query.isError()) {
        <span>Not ready ...</span>
      }
    }

    <div>{{ query.isLoading() ? 'Fetching...' : '' }}</div>
  </div>`,
})
export class TodosComponent {
  query = injectQuery(() => ({
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
      <todos-table data="query.data()" />
    </div>
  `,
})
export class TodosComponent {
  filter = signal('')

  todosQuery = injectQuery(() => ({
    queryKey: ['todos', this.filter()],
    queryFn: () => fetchTodos(this.filter()),
    enabled: !!this.filter(),
  }))
}
```

[//]: # 'Example2'
[//]: # 'Example3'

```angular-ts
import { skipToken, injectQuery } from '@tanstack/query-angular'

@Component({
  selector: 'todos',
  template: `
    <div>
      // 🚀 applying the filter will enable and execute the query
      <filters-form onApply="filter.set" />
      <todos-table data="query.data()" />
    </div>
  `,
})
export class TodosComponent {
  filter = signal('')

  todosQuery = injectQuery(() => ({
    queryKey: ['todos', this.filter()],
    queryFn: this.filter() ? () => fetchTodos(this.filter()) : skipToken,
  }))
}
```

[//]: # 'Example3'
