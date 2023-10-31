---
id: quick-start
title: Quick Start
ref: docs/react/quick-start.md
replace: { 'React': 'Angular' }
---

[//]: # 'Example'

If you're looking for a fully functioning example, please have a look at our [basic codesandbox example](../examples/angular/basic)

### Provide the client to your App

```typescript
bootstrapApplication(AppComponent, {
  providers: [provideAngularQuery(new QueryClient())],
})
```

### Component with signals, query and mutation

```typescript
import {
  CreateMutation,
  CreateQuery,
  UseQueryClient,
} from '@tanstack/angular-query-experimental'
import { getTodos, postTodo } from '../my-api'

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <ul>
        <li *ngFor="let todo of query().data">
          {{ todo.title }}
        </li>
      </ul>

      <button
        (click)="onAddTodo()"
      >
        Add Todo
      </button>
    </div>
  `,
})
export class TodosComponent {
  createQuery = inject(CreateQuery)
  createMutation = inject(CreateMutation)

  // Access the client
  useQueryClient = inject(UseQueryClient)

  // Signals
  queryOptions = signal({ queryKey: ['todos'], queryFn: getTodos })

  mutationOptions = signal({
    mutationFn: postTodo,
    onSuccess: () => {
      // Invalidate and refetch
      this.useQueryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  // Queries
  query = this.createQuery(this.queryOptions)

  // Mutations
  mutation = this.createMutation(this.mutationOptions)

  onAddTodo() {
    this.mutation().mutate({
      id: Date.now(),
      title: 'Do Laundry',
    })
  }
}
```

[//]: # 'Example'
