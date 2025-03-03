import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input,
} from '@angular/core'
import { QueryClient, injectQuery } from '@tanstack/angular-query-experimental'
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs'
import { PostsService } from '../services/posts-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  standalone: true,
  templateUrl: './post.component.html',
})
export class PostComponent {
  #postsService = inject(PostsService)

  @Output() setPostId = new EventEmitter<number>()

  postId = input(0)

  postQuery = injectQuery(() => ({
    enabled: this.postId() > 0,
    queryKey: ['post', this.postId()],
    queryFn: async (context) => {
      // Cancels the request when component is destroyed before the request finishes
      const abort$ = fromEvent(context.signal, 'abort')
      return lastValueFrom(
        this.#postsService.postById$(this.postId()).pipe(takeUntil(abort$)),
      )
    },
  }))

  queryClient = inject(QueryClient)
}
