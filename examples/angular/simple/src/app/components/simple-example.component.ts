import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { ReposQueries } from '../services/repos/queries'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'simple-example',
  templateUrl: './simple-example.component.html',
})
export class SimpleExampleComponent {
  readonly #queries = inject(ReposQueries)

  readonly query = injectQuery(() => this.#queries.detail())
}
