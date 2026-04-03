import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core'
import { QueryClient, injectQuery } from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { PostsService } from '../services/posts-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  templateUrl: './posts.component.html',
})
export class PostsComponent {
  readonly queryClient = inject(QueryClient)
  readonly #postsService = inject(PostsService)
  readonly setPostId = output<number>()

  readonly postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: () => lastValueFrom(this.#postsService.allPosts$()),
  }))
}
