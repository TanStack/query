import { Injectable, inject } from '@angular/core'
import { queryOptions } from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { ProjectsAPI } from './api'

@Injectable({
  providedIn: 'root',
})
export class ProjectsQueries {
  readonly #api = inject(ProjectsAPI)

  all = () => ['projects'] as const

  list = (page: number) =>
    queryOptions({
      queryKey: [...this.all(), 'list', page] as const,
      queryFn: () => lastValueFrom(this.#api.getProjects(page)),
    })
}
