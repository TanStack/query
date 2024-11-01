import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental'
import { QueriesService } from '../services/queries-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  standalone: true,
  templateUrl: './posts.component.html',
  imports: [RouterLink],
})
export default class PostsComponent {
  private queries = inject(QueriesService)

  postsQuery = injectQuery(() => this.queries.posts())
  queryClient = injectQueryClient()
}
