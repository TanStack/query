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
    () => !this.query.hasNextPage() || this.query.isFetchingNextPage(),
  )

  readonly nextButtonText = computed(() =>
    this.query.isFetchingNextPage()
      ? 'Loading more...'
      : this.query.hasNextPage()
        ? 'Load newer'
        : 'Nothing more to load',
  )

  readonly previousButtonDisabled = computed(
    () => !this.query.hasPreviousPage() || this.query.isFetchingPreviousPage(),
  )
  readonly previousButtonText = computed(() =>
    this.query.isFetchingPreviousPage()
      ? 'Loading more...'
      : this.query.hasPreviousPage()
        ? 'Load Older'
        : 'Nothing more to load',
  )
}
