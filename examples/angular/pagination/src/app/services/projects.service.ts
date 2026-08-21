import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'

interface Project {
  id: number
  name: string
}

interface ProjectResponse {
  projects: Array<Project>
  hasMore: boolean
}

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  readonly #http = inject(HttpClient)

  getProjects(page: number) {
    return this.#http.get<ProjectResponse>(`/api/projects?page=${page}`)
  }
}
