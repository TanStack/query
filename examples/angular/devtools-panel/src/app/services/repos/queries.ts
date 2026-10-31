import { Injectable, inject } from '@angular/core'
import { queryOptions } from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { ReposAPI } from './api'

@Injectable({
  providedIn: 'root',
})
export class ReposQueries {
  readonly #api = inject(ReposAPI)

  all = () => ['repos'] as const

  detail = () =>
    queryOptions({
      queryKey: [...this.all(), 'detail'] as const,
      queryFn: () => lastValueFrom(this.#api.getRepo()),
    })
}
