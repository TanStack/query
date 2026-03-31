import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'

interface Project {
  id: number
  name: string
}

interface ProjectResponse {
  data: Array<Project>
  nextId: number | undefined
  previousId: number | undefined
}

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  readonly #http = inject(HttpClient)
  getProjects = (page: number) =>
    this.#http.get<ProjectResponse>(`/api/projects?cursor=${page}`)
}
