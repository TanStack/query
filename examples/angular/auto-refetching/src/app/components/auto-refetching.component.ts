import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import {
  QueryClient,
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental'
import { NgStyle } from '@angular/common'
import { TasksMutations, TasksQueries } from '../services/tasks/queries'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'auto-refetching-example',
  templateUrl: './auto-refetching.component.html',
  imports: [NgStyle],
})
export class AutoRefetchingExampleComponent {
  readonly #queryClient = inject(QueryClient)
  readonly #tasksQueries = inject(TasksQueries)
  readonly #tasksMutations = inject(TasksMutations)

  readonly intervalMs = signal(1000)

  readonly tasks = injectQuery(() => ({
    ...this.#tasksQueries.list(),
    refetchInterval: this.intervalMs(),
  }))

  readonly addMutation = injectMutation(() => ({
    ...this.#tasksMutations.create(),
    onSuccess: () => {
      this.#queryClient.invalidateQueries({
        queryKey: this.#tasksQueries.list().queryKey,
      })
    },
  }))
  readonly clearMutation = injectMutation(() => ({
    ...this.#tasksMutations.deleteAll(),
    onSuccess: () => {
      this.#queryClient.invalidateQueries({
        queryKey: this.#tasksQueries.list().queryKey,
      })
    },
  }))

  clearTasks() {
    this.clearMutation.mutate()
  }

  inputChange($event: Event) {
    const target = $event.target as HTMLInputElement
    this.intervalMs.set(Number(target.value))
  }

  addItem($event: Event) {
    const target = $event.target as HTMLInputElement
    const value = target.value
    this.addMutation.mutate(value)
    target.value = ''
  }
}
