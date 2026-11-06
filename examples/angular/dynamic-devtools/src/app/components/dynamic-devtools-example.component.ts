import { HttpClient } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query'
import { lastValueFrom } from 'rxjs'

interface Response {
  name: string
  description: string
  subscribers_count: number
  stargazers_count: number
  forks_count: number
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dynamic-devtools-example',
  templateUrl: './dynamic-devtools-example.component.html',
})
export class DynamicDevtoolsExampleComponent {
  readonly #http = inject(HttpClient)

  readonly query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      lastValueFrom(
        this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
      ),
  }))
}
