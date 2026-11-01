import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core'
import { QueryClient, injectQuery } from '@tanstack/angular-query-experimental'
import { PostsQueries } from '../services/posts/queries'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  templateUrl: './posts.component.html',
})
export class PostsComponent {
  readonly queryClient = inject(QueryClient)
  readonly postsQueries = inject(PostsQueries)
  readonly setPostId = output<number>()

  readonly postsQuery = injectQuery(() => this.postsQueries.list())
}
