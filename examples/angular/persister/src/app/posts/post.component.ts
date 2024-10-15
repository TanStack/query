import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs'
import { RouterLink } from '@angular/router'
import { PostsService } from './posts.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  standalone: true,
  templateUrl: './post.component.html',
  imports: [RouterLink],
})
export default class PostComponent {
  #postsService = inject(PostsService)

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
}
