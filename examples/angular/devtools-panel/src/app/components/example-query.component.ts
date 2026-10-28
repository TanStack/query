import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { ReposQueries } from '../services/repos/queries'

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
      @if (query.isSuccess()) {
        @let data = query.data();
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
  readonly #reposQueries = inject(ReposQueries)

  readonly query = injectQuery(() => this.#reposQueries.detail())
}
