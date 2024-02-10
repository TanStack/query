import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core'
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
})
export class PostsComponent {
  #postsService = inject(PostsService)

  @Output() setPostId = new EventEmitter<number>()

  postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: () => lastValueFrom(this.#postsService.allPosts$()),
  }))

  queryClient = injectQueryClient()
}
