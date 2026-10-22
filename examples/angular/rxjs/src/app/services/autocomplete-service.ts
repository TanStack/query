import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { of } from 'rxjs'

interface SuggestionsResponse {
  suggestions: Array<string>
}

@Injectable({
  providedIn: 'root',
})
export class AutocompleteService {
  readonly #http = inject(HttpClient)

  getSuggestions = (term: string = '') =>
    term.trim() === ''
      ? of({ suggestions: [] })
      : this.#http.get<SuggestionsResponse>(
          `/api/autocomplete?term=${encodeURIComponent(term)}`,
        )
}
