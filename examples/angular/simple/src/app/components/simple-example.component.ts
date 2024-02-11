import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { HttpClient } from '@angular/common/http'
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
  selector: 'simple-example',
  standalone: true,
  templateUrl: './simple-example.component.html',
  imports: [AngularQueryDevtools],
})
export class SimpleExampleComponent {
  #http = inject(HttpClient)

  query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      lastValueFrom(
        this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
      ),
  }))
}
