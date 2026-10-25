import { Injectable, inject } from '@angular/core'
import { queryOptions } from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { SuggestionsAPI } from './api'

@Injectable({
  providedIn: 'root',
})
export class SuggestionsQueries {
  readonly #api = inject(SuggestionsAPI)

  all = () => ['suggestions'] as const

  list = (term: string) =>
    queryOptions({
      queryKey: [...this.all(), 'list', term] as const,
      queryFn: () => lastValueFrom(this.#api.getSuggestions(term)),
    })
}
