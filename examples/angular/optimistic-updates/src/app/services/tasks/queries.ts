import { Injectable, inject } from '@angular/core'
import {
  mutationOptions,
  queryOptions,
} from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { TasksAPI } from './api'

@Injectable({
  providedIn: 'root',
})
export class TasksQueries {
  readonly #api = inject(TasksAPI)

  all = () => ['tasks'] as const

  list = () =>
    queryOptions({
      queryKey: [...this.all(), 'list'] as const,
      queryFn: () => lastValueFrom(this.#api.getTasks()),
    })
}

@Injectable({
  providedIn: 'root',
})
export class TasksMutations {
  readonly #api = inject(TasksAPI)
  readonly #queries = inject(TasksQueries)

  create = () =>
    mutationOptions({
      mutationKey: [...this.#queries.all(), 'create'] as const,
      mutationFn: (variables: { task: string; failMutation: boolean }) =>
        lastValueFrom(this.#api.createTask(variables)),
    })
}
