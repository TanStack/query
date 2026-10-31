import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class TasksAPI {
  readonly #http = inject(HttpClient)

  getTasks = () => this.#http.get<Array<string>>('/api/tasks')

  createTask = ({
    task,
    failMutation = false,
  }: {
    task: string
    failMutation: boolean
  }) => this.#http.post(`/api/tasks${failMutation ? '-wrong-url' : ''}`, task)
}
