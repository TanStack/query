import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  numberAttribute,
} from '@angular/core'
import { RouterLink } from '@angular/router'
import { injectQuery } from '@tanstack/angular-query'
import { lastValueFrom } from 'rxjs'
import { PostsService } from '../services/posts-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  templateUrl: './post.component.html',
  imports: [RouterLink],
})
export default class PostComponent {
  #postsService = inject(PostsService)

  // The Angular router will automatically bind postId
  // as `withComponentInputBinding` is added to `provideRouter`.
  // See https://angular.dev/api/router/withComponentInputBinding
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
