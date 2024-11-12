import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { of } from 'rxjs'

interface Response {
  suggestions: Array<string>
}

@Injectable({
  providedIn: 'root',
})
export class AutocompleteService {
  #http = inject(HttpClient)
  getSuggestions = (term: string = '') =>
    term.trim() === ''
      ? of({ suggestions: [] })
      : this.#http.get<Response>(`/api/autocomplete?term=${term}`)
}
