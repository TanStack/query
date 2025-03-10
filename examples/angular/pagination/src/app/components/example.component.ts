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
} from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { ProjectsService } from '../services/projects.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'example',
  templateUrl: './example.component.html',
})
export class ExampleComponent {
  readonly queryClient = inject(QueryClient)
  readonly projectsService = inject(ProjectsService)
  readonly page = signal(0)

  readonly query = injectQuery(() => ({
    queryKey: ['projects', this.page()],
    queryFn: () => {
      return lastValueFrom(this.projectsService.getProjects(this.page()))
    },
    placeholderData: keepPreviousData,
    staleTime: 5000,
  }))

  readonly prefetchEffect = effect(() => {
    const data = this.query.data()
    const isPlaceholderData = this.query.isPlaceholderData()
    const newPage = this.page() + 1

    untracked(() => {
      if (!isPlaceholderData && data?.hasMore) {
        void this.queryClient.prefetchQuery({
          queryKey: ['projects', newPage],
          queryFn: () =>
            lastValueFrom(this.projectsService.getProjects(newPage)),
        })
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
