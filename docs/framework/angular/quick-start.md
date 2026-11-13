---
id: quick-start
title: Quick Start
---

[//]: # 'Example'

If you're looking for a fully functioning example, please have a look at our [basic codesandbox example](./examples/basic)

### Configure the QueryClient

Pass a factory to `provideTanStackQuery`. Angular runs it once per injector and in an injection context, so it can use `inject()`.

```ts
import { provideHttpClient } from '@angular/common/http'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query'

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideTanStackQuery(() => new QueryClient()),
  ],
})
```

### Component with query and mutation

```angular-ts
import { Component, Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { lastValueFrom } from 'rxjs'

import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query'

@Component({
  template: `
    <div>
      <button (click)="onAddTodo()">Add Todo</button>

      <ul>
        @for (todo of todosQuery.data(); track todo.title) {
          <li>{{ todo.title }}</li>
        }
      </ul>
    </div>
  `,
})
export class TodosComponent {
  readonly todoService = inject(TodoService)
  readonly queryClient = inject(QueryClient)

  readonly todosQuery = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => this.todoService.getTodos(),
  }))

  readonly addTodoMutation = injectMutation(() => ({
    mutationFn: (todo: Todo) => this.todoService.addTodo(todo),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  }))

  onAddTodo() {
    this.addTodoMutation.mutate({
      id: Date.now().toString(),
      title: 'Do Laundry',
    })
  }
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly http = inject(HttpClient)

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
