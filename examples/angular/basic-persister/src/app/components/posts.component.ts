import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core'
import { QueryClient, injectQuery } from '@tanstack/angular-query'
import { lastValueFrom } from 'rxjs'
import { PostsService } from '../services/posts-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  standalone: true,
  templateUrl: './posts.component.html',
})
export class PostsComponent {
  queryClient = inject(QueryClient)
  #postsService = inject(PostsService)

  @Output() setPostId = new EventEmitter<number>()

  postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: () => lastValueFrom(this.#postsService.allPosts$()),
  }))
}
