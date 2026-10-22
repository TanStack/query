import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { HttpClient } from '@angular/common/http'
import { lastValueFrom } from 'rxjs'

interface Repo {
  name: string
  description: string
  subscribers_count: number
  stargazers_count: number
  forks_count: number
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'simple-example',
  templateUrl: './simple-example.component.html',
})
export class SimpleExampleComponent {
  readonly #http = inject(HttpClient)

  readonly query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      lastValueFrom(
        this.#http.get<Repo>('https://api.github.com/repos/TanStack/query'),
      ),
  }))
}
