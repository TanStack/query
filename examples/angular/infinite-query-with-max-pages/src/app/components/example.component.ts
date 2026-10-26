import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core'
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental'
import { ProjectStyleDirective } from '../directives/project-style.directive'
import { ProjectsQueries } from '../services/projects/queries'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'example',
  templateUrl: './example.component.html',
  imports: [ProjectStyleDirective],
})
export class ExampleComponent {
  readonly #projectsQueries = inject(ProjectsQueries)

  readonly query = injectInfiniteQuery(() => ({
    ...this.#projectsQueries.list(),
    maxPages: 3,
  }))

  readonly nextButtonDisabled = computed(
    () => !this.#hasNextPage() || this.#isFetchingNextPage(),
  )

  readonly nextButtonText = computed(() =>
    this.#isFetchingNextPage()
      ? 'Loading more...'
      : this.#hasNextPage()
        ? 'Load newer'
        : 'Nothing more to load',
  )

  readonly previousButtonDisabled = computed(
    () => !this.#hasPreviousPage() || this.#isFetchingPreviousPage(),
  )
  readonly previousButtonText = computed(() =>
    this.#isFetchingPreviousPage()
      ? 'Loading more...'
      : this.#hasPreviousPage()
        ? 'Load Older'
        : 'Nothing more to load',
  )

  readonly #hasPreviousPage = this.query.hasPreviousPage
  readonly #hasNextPage = this.query.hasNextPage
  readonly #isFetchingPreviousPage = this.query.isFetchingPreviousPage
  readonly #isFetchingNextPage = this.query.isFetchingNextPage
}
