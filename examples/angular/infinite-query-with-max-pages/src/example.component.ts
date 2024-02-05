import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core'
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { ProjectStyleDirective } from './project-style.directive'
import { ProjectsService } from './projects-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'example',
  standalone: true,
  templateUrl: './example.component.html',
  imports: [AngularQueryDevtools, ProjectStyleDirective],
})
export class Example {
  projectsService = inject(ProjectsService)

  query = injectInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: async ({ pageParam }) => {
      return lastValueFrom(this.projectsService.getProjects(pageParam))
    },
    initialPageParam: 0,
    getPreviousPageParam: (firstPage) => firstPage.previousId ?? undefined,
    getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
    maxPages: 3,
  }))

  nextButtonDisabled = computed(
    () => !this.#hasNextPage() || this.#isFetchingNextPage(),
  )
  nextButtonText = computed(() =>
    this.#isFetchingNextPage()
      ? 'Loading more...'
      : this.#hasNextPage()
        ? 'Load newer'
        : 'Nothing more to load',
  )
  previousButtonDisabled = computed(
    () => !this.#hasPreviousPage() || this.#isFetchingNextPage(),
  )
  previousButtonText = computed(() =>
    this.#isFetchingPreviousPage()
      ? 'Loading more...'
      : this.#hasPreviousPage()
        ? 'Load Older'
        : 'Nothing more to load',
  )

  #hasPreviousPage = this.query.hasPreviousPage
  #hasNextPage = this.query.hasNextPage
  #isFetchingPreviousPage = this.query.isFetchingPreviousPage
  #isFetchingNextPage = this.query.isFetchingNextPage
}
