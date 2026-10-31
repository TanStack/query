import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { Repo } from './types'

@Injectable({
  providedIn: 'root',
})
export class ReposAPI {
  readonly #http = inject(HttpClient)

  getRepo = () =>
    this.#http.get<Repo>('https://api.github.com/repos/TanStack/query')
}
