---
id: disabling-queries
title: Disabling/Pausing Queries
ref: docs/react/guides/disabling-queries.md
replace: { 'useQuery': 'injectQuery' }
---

[//]: # 'Example'

```ts
@Component({
  selector: 'todos',
  templateUrl: './todos.component.html',
  imports: [CommonModule],
})
export class TodosComponent {
  query = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
    enabled: false,
  }))
}
```

```html
<div>
  <button (click)="query.refetch()">Fetch Todos</button>

  <ng-container *ngIf="query.data(); else loadingOrError">
    <ul>
      <li *ngFor="let todo of query.data()">{{ todo.title }}</li>
    </ul>
  </ng-container>

  <ng-template #loadingOrError>
    <span *ngIf="query.isError()">Error: {{ query.error().message }}</span>
    <span *ngIf="query.isLoading()">Loading...</span>
    <span *ngIf="!query.isLoading() && !query.isError()"> Not ready ... </span>
  </ng-template>

  <div>{{ query.isLoading() ? 'Fetching...' : '' }}</div>
</div>
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
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
