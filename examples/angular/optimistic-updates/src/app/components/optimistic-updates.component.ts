import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { injectMutation, injectQuery } from '@tanstack/angular-query'
import { FormsModule } from '@angular/forms'
import { DatePipe } from '@angular/common'
import { TasksService } from '../services/tasks.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'optimistic-updates',
  imports: [FormsModule, DatePipe],
  template: `
    <p>
      In this example, new items can be created using a mutation. The new item
      will be optimistically added to the list in hopes that the server accepts
      the item. If it does, the list is refetched with the true items from the
      list. Every now and then, the mutation may fail though. When that happens,
      the previous list of items is restored and the list is again refetched
      from the server.
    </p>

    <hr />
    @if (tasks.isLoading()) {
      <p>Loading...</p>
    }

    <div class="container">
      <label>
        <input type="checkbox" [(ngModel)]="failMutation" />
        Fail Mutation
      </label>

      <div class="input-container">
        <input type="text" [(ngModel)]="newItem" placeholder="Enter text" />
        <button (click)="addItem()">Create</button>
        <ul>
          @for (task of tasks.data(); track task) {
            <li>{{ task }}</li>
          }
        </ul>

        <div>
          Updated At: {{ tasks.dataUpdatedAt() | date: 'MMMM d, h:mm:ss a ' }}
        </div>
      </div>
      @if (!tasks.isLoading() && tasks.isFetching()) {
        <p>Fetching in background</p>
      }
    </div>
  `,
})
export class OptimisticUpdatesComponent {
  #tasksService = inject(TasksService)

  tasks = injectQuery(() => this.#tasksService.allTasks())
  clearMutation = injectMutation(() => this.#tasksService.addTask())
  addMutation = injectMutation(() => this.#tasksService.addTask())

  newItem = ''
  failMutation = false

  addItem() {
    if (!this.newItem) return

    this.addMutation.mutate({
      task: this.newItem,
      failMutation: this.failMutation,
    })
    this.newItem = ''
  }
}
