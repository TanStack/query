---
id: queries
title: Queries
ref: docs/framework/react/guides/queries.md
replace:
  {
    'React': 'Angular',
    'react-query': 'angular-query',
    'promise': 'promise or observable',
    'custom hooks': 'services',
    'the `useQuery` hook': '`injectQuery`',
    '`useQuery`': '`injectQuery`',
    "TypeScript will also narrow the type of data correctly if you've checked for pending and error before accessing it.": 'TypeScript will only narrow the type when checking boolean signals such as `isPending` and `isError`.',
  }
---

[//]: # 'Example'

```ts
import { injectQuery } from '@tanstack/angular-query-experimental'

export class TodosComponent {
  readonly todosQuery = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  }))
}
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
todosQuery = injectQuery(() => ({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
}))
```

[//]: # 'Example2'
[//]: # 'Example3'

```angular-ts
@Component({
  selector: 'todos',
  template: `
    @if (todosQuery.isPending()) {
      <span>Loading...</span>
    } @else if (todosQuery.isError()) {
      <span>Error: {{ todosQuery.error()?.message }}</span>
    } @else {
      <!-- We can assume by this point that status === 'success' -->
      @for (todo of todosQuery.data(); track todo.id) {
        <li>{{ todo.title }}</li>
      } @empty {
        <li>No todos found</li>
      }
    }
  `,
})
export class PostsComponent {
  readonly todosQuery = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  }))
}
```

[//]: # 'Example3'

If booleans aren't your thing, you can always use the `status` state as well:

[//]: # 'Example4'

```angular-ts
@Component({
  selector: 'todos',
  template: `
    @switch (todosQuery.status()) {
      @case ('pending') {
        <span>Loading...</span>
      }
      @case ('error') {
        <span>Error: {{ todosQuery.error()?.message }}</span>
      }
      <!-- also status === 'success', but "else" logic works, too -->
      @default {
        <ul>
          @for (todo of todosQuery.data(); track todo.id) {
            <li>{{ todo.title }}</li>
          } @empty {
            <li>No todos found</li>
          }
        </ul>
      }
    }
  `,
})
class TodosComponent {}
```

[//]: # 'Example4'
[//]: # 'Materials'
[//]: # 'Materials'
