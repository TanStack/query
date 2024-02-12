import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
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
  selector: 'posts',
  standalone: true,
  templateUrl: './posts.component.html',
  imports: [RouterLink],
})
export default class PostsComponent {
  #postsService = inject(PostsService)

  postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: () => lastValueFrom(this.#postsService.allPosts$()),
  }))

  queryClient = injectQueryClient()
}
