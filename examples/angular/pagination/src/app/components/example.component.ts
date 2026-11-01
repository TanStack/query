import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core'
import {
  QueryClient,
  injectQuery,
  keepPreviousData,
  noop,
} from '@tanstack/angular-query-experimental'
import { ProjectsQueries } from '../services/projects/queries'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'example',
  templateUrl: './example.component.html',
})
export class ExampleComponent {
  readonly queryClient = inject(QueryClient)
  readonly #projectsQueries = inject(ProjectsQueries)
  readonly page = signal(0)

  readonly query = injectQuery(() => ({
    ...this.#projectsQueries.list(this.page()),
    placeholderData: keepPreviousData,
    staleTime: 5000,
  }))

  readonly prefetchEffect = effect(() => {
    const data = this.query.data()
    const isPlaceholderData = this.query.isPlaceholderData()
    const newPage = this.page() + 1

    untracked(() => {
      if (!isPlaceholderData && data?.hasMore) {
        void this.queryClient
          .query(this.#projectsQueries.list(newPage))
          .catch(noop)
      }
    })
  })

  previousPage() {
    this.page.update((currentPage) => {
      return Math.max(currentPage - 1, 0)
    })
  }

  nextPage() {
    this.page.update((currentPage) => {
      return this.query.data()?.hasMore ? currentPage + 1 : currentPage
    })
  }
}
