import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental'
import { NgStyle } from '@angular/common'
import { TasksService } from '../services/tasks.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'auto-refetching-example',
  templateUrl: './auto-refetching.component.html',
  imports: [NgStyle],
})
export class AutoRefetchingExampleComponent {
  readonly #tasksService = inject(TasksService)

  readonly intervalMs = signal(1000)

  readonly tasks = injectQuery(() =>
    this.#tasksService.allTasks(this.intervalMs()),
  )

  readonly addMutation = injectMutation(() => this.#tasksService.addTask())
  readonly clearMutation = injectMutation(() =>
    this.#tasksService.clearAllTasks(),
  )

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
