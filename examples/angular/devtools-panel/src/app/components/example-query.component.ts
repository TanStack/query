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
  selector: 'example-query',
  template: `
    <div style="padding-bottom: 20px">
      @if (query.isPending()) {
        <div>Loading...</div>
      }
      @if (query.isError()) {
        <div>An error has occurred: {{ query.error().message }}</div>
      }
      @if (query.data(); as data) {
        <h1>{{ data.name }}</h1>
        <p>{{ data.description }}</p>
        <strong>👀 {{ data.subscribers_count }}</strong>
        <strong>✨ {{ data.stargazers_count }}</strong>
        <strong>🍴 {{ data.forks_count }}</strong>
      }
    </div>
  `,
})
export class ExampleQueryComponent {
  #http = inject(HttpClient)

  query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      lastValueFrom(
        this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
      ),
  }))
}
