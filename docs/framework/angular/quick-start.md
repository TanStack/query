---
id: quick-start
title: Quick Start
---

> VERY IMPORTANT: This library is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

[//]: # 'Example'

If you're looking for a fully functioning example, please have a look at our [basic codesandbox example](./examples/basic)

### Provide the client to your App

```ts
import { provideHttpClient } from '@angular/common/http'
import {
  provideAngularQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental'

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideAngularQuery(new QueryClient())],
})
```

### Component with query and mutation

```ts
import { Component, Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { lastValueFrom } from 'rxjs'

import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental'

@Component({
  standalone: true,
  template: `
    <div>
      <button (click)="onAddTodo()">Add Todo</button>

      <ul>
        @for (todo of query.data(); track todo.title) {
          <li>{{ todo.title }}</li>
        }
      </ul>
    </div>
  `,
})
export class TodosComponent {
  todoService = inject(TodoService)
  queryClient = injectQueryClient()

  query = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => this.todoService.getTodos(),
  }))

  mutation = injectMutation((client) => ({
    mutationFn: (todo: Todo) => this.todoService.addTodo(todo),
    onSuccess: () => {
      // Invalidate and refetch by using the client directly
      client.invalidateQueries({ queryKey: ['todos'] })

      // OR use the queryClient that is injected into the component
      // this.queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  }))

  onAddTodo() {
    this.mutation.mutate({
      id: Date.now().toString(),
      title: 'Do Laundry',
    })
  }
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  private http = inject(HttpClient)

  getTodos(): Promise<Todo[]> {
    return lastValueFrom(
      this.http.get<Todo[]>('https://jsonplaceholder.typicode.com/todos'),
    )
  }

  addTodo(todo: Todo): Promise<Todo> {
    return lastValueFrom(
      this.http.post<Todo>('https://jsonplaceholder.typicode.com/todos', todo),
    )
  }
}

interface Todo {
  id: string
  title: string
}
```

[//]: # 'Example'
