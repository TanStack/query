import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental'
import { FormsModule } from '@angular/forms'
import { DatePipe } from '@angular/common'
import { TasksService } from '../services/tasks.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'unit-testing',
  imports: [FormsModule, DatePipe],
  template: `
    <p>
      This example is the same as the optimistic-updates one but where we show
      how to test your service.
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
export class UnitTestingComponent {
  #tasksService = inject(TasksService)

  tasks = injectQuery(() => this.#tasksService.allTasks())
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
