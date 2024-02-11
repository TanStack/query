import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input,
} from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { PostsService } from '../services/posts-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  standalone: true,
  templateUrl: './post.component.html',
  imports: [RouterLink],
})
export default class PostComponent {
  #postsService = inject(PostsService)

  postId = input<number, string>(0, {
    transform: (value: string) => Number(value),
  })

  postQuery = injectQuery(() => ({
    enabled: this.postId() > 0,
    queryKey: ['post', this.postId()],
    queryFn: async () => {
      return lastValueFrom(this.#postsService.postById$(this.postId()))
    },
  }))
}
