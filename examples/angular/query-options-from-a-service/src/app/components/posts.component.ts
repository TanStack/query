import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { QueryClient, injectQuery } from '@tanstack/angular-query'
import { QueriesService } from '../services/queries-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  templateUrl: './posts.component.html',
  imports: [RouterLink],
})
export default class PostsComponent {
  private queries = inject(QueriesService)

  postsQuery = injectQuery(() => this.queries.posts())
  queryClient = inject(QueryClient)
}
