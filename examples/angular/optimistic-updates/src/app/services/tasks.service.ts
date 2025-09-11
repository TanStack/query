import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import {
  QueryClient,
  mutationOptions,
  queryOptions,
} from '@tanstack/angular-query-experimental'

import { lastValueFrom } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  #queryClient = inject(QueryClient) // Manages query state and caching
  #http = inject(HttpClient) // Handles HTTP requests

  /**
   * Fetches all tasks from the API.
   * Returns an observable containing an array of task strings.
   */
  allTasks = () =>
    queryOptions({
      queryKey: ['tasks'],
      queryFn: () => {
        return lastValueFrom(this.#http.get<Array<string>>('/api/tasks'))
      },
    })

  /**
   * Creates a mutation for adding a task.
   * On success, invalidates and refetches the "tasks" query cache to update the task list.
   */
  addTask() {
    return mutationOptions({
      mutationFn: ({
        task,
        failMutation = false,
      }: {
        task: string
        failMutation: boolean
      }) =>
        lastValueFrom(
          this.#http.post(
            `/api/tasks${failMutation ? '-wrong-url' : ''}`,
            task,
          ),
        ),
      mutationKey: ['tasks'],
      onSuccess: () => {},
      onMutate: async ({ task }: { task: string }) => {
        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await this.#queryClient.cancelQueries({ queryKey: ['tasks'] })

        // Snapshot the previous value
        const previousTodos = this.#queryClient.getQueryData<Array<string>>([
          'tasks',
        ])

        // Optimistically update to the new value
        if (previousTodos) {
          this.#queryClient.setQueryData<Array<string>>(
            ['tasks'],
            [...previousTodos, task],
          )
        }

        return previousTodos
      },
      onError: (_err: any, _variables: any, context: any) => {
        if (context) {
          this.#queryClient.setQueryData<Array<string>>(['tasks'], context)
        }
      },
      // Always refetch after error or success:
      onSettled: () => {
        return this.#queryClient.invalidateQueries({ queryKey: ['tasks'] })
      },
    })
  }
}
