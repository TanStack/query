import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query'
import { NgStyle } from '@angular/common'
import { TasksService } from '../services/tasks.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'auto-refetching-example',
  standalone: true,
  templateUrl: './auto-refetching.component.html',
  imports: [NgStyle],
})
export class AutoRefetchingExampleComponent {
  #tasksService = inject(TasksService)

  intervalMs = signal(1000)

  tasks = injectQuery(() => this.#tasksService.allTasks(this.intervalMs()))

  addMutation = injectMutation(() => this.#tasksService.addTask())
  clearMutation = injectMutation(() => this.#tasksService.clearAllTasks())

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
