import { Injectable, inject } from '@angular/core'
import { infiniteQueryOptions } from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { ProjectsAPI } from './api'

@Injectable({
  providedIn: 'root',
})
export class ProjectsQueries {
  readonly #api = inject(ProjectsAPI)

  all = () => ['projects'] as const

  list = () =>
    infiniteQueryOptions({
      queryKey: [...this.all(), 'list'] as const,
      queryFn: ({ pageParam }) =>
        lastValueFrom(this.#api.getProjects(pageParam)),
      initialPageParam: 0,
      getPreviousPageParam: (firstPage) => firstPage.previousId ?? undefined,
      getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
    })
}
