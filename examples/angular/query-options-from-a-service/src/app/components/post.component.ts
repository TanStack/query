import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  numberAttribute,
} from '@angular/core'
import { RouterLink } from '@angular/router'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { PostsQueries } from '../services/posts/queries'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  templateUrl: './post.component.html',
  imports: [RouterLink],
})
export default class PostComponent {
  readonly #postsQueries = inject(PostsQueries)

  readonly postId = input.required({
    transform: numberAttribute,
  })

  readonly postQuery = injectQuery(() =>
    this.#postsQueries.detail(this.postId()),
  )
}
