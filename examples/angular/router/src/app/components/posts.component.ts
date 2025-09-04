import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { QueryClient, injectQuery } from '@tanstack/angular-query'
import { lastValueFrom } from 'rxjs'
import { PostsService } from '../services/posts-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  templateUrl: './posts.component.html',
  imports: [RouterLink],
})
export default class PostsComponent {
  readonly #postsService = inject(PostsService)

  readonly postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: () => lastValueFrom(this.#postsService.allPosts$()),
  }))

  readonly queryClient = inject(QueryClient)
}
