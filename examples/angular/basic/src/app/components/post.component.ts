import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core'
import { injectQuery } from '@tanstack/angular-query'
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs'
import { PostsService } from '../services/posts-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  standalone: true,
  templateUrl: './post.component.html',
})
export class PostComponent {
  readonly #postsService = inject(PostsService)

  readonly setPostId = output<number>()
  readonly postId = input(0)

  readonly postQuery = injectQuery(() => ({
    enabled: this.postId() > 0,
    queryKey: ['post', this.postId()],
    queryFn: (context) => {
      // Cancels the request when component is destroyed before the request finishes
      const abort$ = fromEvent(context.signal, 'abort')
      return lastValueFrom(
        this.#postsService.postById$(this.postId()).pipe(takeUntil(abort$)),
      )
    },
  }))
}
