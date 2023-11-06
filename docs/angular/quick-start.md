---
id: quick-start
title: Quick Start
---

> VERY IMPORTANT: This library is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

[//]: # 'Example'

If you're looking for a fully functioning example, please have a look at our [basic codesandbox example](../examples/angular/basic)

### Provide the client to your App

```typescript
bootstrapApplication(AppComponent, {
  providers: [provideAngularQuery(new QueryClient())],
})
```

### Component with query and mutation

```typescript
import {
  injectMutation,
  injectQuery,
  injectQueryClient
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
  queryClient = injectQueryClient()

  query = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: getTodos
  }))

  mutation = injectMutation(() => ({
    mutationFn: postTodo,
    onSuccess: () => {
      // Invalidate and refetch
      this.queryClient.invalidateQueries({ queryKey: ['todos'] })
    }
  }))

  onAddTodo() {
    this.mutation().mutate({
      id: Date.now(),
      title: 'Do Laundry',
    })
  }
}
```

[//]: # 'Example'
