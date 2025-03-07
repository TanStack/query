import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core'
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental'
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
  projectsService = inject(ProjectsService)

  query = injectInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => {
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
