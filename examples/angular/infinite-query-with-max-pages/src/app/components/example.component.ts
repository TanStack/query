import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core'
import { injectInfiniteQuery } from '@tanstack/angular-query'
import { lastValueFrom } from 'rxjs'
import { ProjectStyleDirective } from '../directives/project-style.directive'
import { ProjectsService } from '../services/projects.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'example',
  templateUrl: './example.component.html',
  imports: [ProjectStyleDirective],
})
export class ExampleComponent {
  readonly projectsService = inject(ProjectsService)

  readonly query = injectInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => {
      return lastValueFrom(this.projectsService.getProjects(pageParam))
    },
    initialPageParam: 0,
    getPreviousPageParam: (firstPage) => firstPage.previousId ?? undefined,
    getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
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
    () => !this.#hasPreviousPage() || this.#isFetchingNextPage(),
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
