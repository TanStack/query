import { HttpClient } from '@angular/common/http'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core'
import {
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental'
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

  // This can be replaced with an input signal in Angular v17.1+:
  // postId = input(0)
  @Input({ required: true, alias: 'postId' })
  set _postId(value: number) {
    this.postId.set(value)
  }
  postId = signal(0)

  httpClient = inject(HttpClient)

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

  queryClient = injectQueryClient()
}
