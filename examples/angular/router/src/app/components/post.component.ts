import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  numberAttribute,
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
  queryClient = injectQueryClient()

  postId = input.required({
    transform: numberAttribute,
  })

  postQuery = injectQuery(() => ({
    queryKey: ['post', this.postId()],
    queryFn: () => {
      return lastValueFrom(this.#postsService.postById$(this.postId()))
    },
  }))
}
