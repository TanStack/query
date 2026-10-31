import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { ProjectResponse } from './types'

@Injectable({
  providedIn: 'root',
})
export class ProjectsAPI {
  readonly #http = inject(HttpClient)

  getProjects = (page: number) =>
    this.#http.get<ProjectResponse>(`/api/projects?cursor=${page}`)
}
