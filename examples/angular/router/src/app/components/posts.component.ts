import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { QueryClient, injectQuery } from '@tanstack/angular-query-experimental'
import { PostsQueries } from '../services/posts/queries'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  templateUrl: './posts.component.html',
  imports: [RouterLink],
})
export default class PostsComponent {
  readonly postsQueries = inject(PostsQueries)

  readonly postsQuery = injectQuery(() => this.postsQueries.list())

  readonly queryClient = inject(QueryClient)
}
