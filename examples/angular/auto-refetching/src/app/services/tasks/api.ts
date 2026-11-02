import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class TasksAPI {
  readonly #http = inject(HttpClient)

  getTasks = () => this.#http.get<Array<string>>('/api/tasks')

  createTask = (task: string) => this.#http.post('/api/tasks', task)

  deleteTasks = () => this.#http.delete('/api/tasks')
}
