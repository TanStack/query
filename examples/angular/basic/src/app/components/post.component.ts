import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { PostsQueries } from '../services/posts/queries'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  templateUrl: './post.component.html',
})
export class PostComponent {
  readonly #postsQueries = inject(PostsQueries)

  readonly setPostId = output<number>()
  readonly postId = input(0)

  readonly postQuery = injectQuery(() => ({
    ...this.#postsQueries.detail(this.postId()),
    enabled: this.postId() > 0,
  }))
}
