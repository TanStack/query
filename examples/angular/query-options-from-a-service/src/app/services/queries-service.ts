import { Injectable, inject } from '@angular/core'
import { lastValueFrom } from 'rxjs'
import { queryOptions } from '@tanstack/angular-query-experimental'
import { PostsService } from './posts-service'

@Injectable({
  providedIn: 'root',
})
export class QueriesService {
  private postsService = inject(PostsService)

  post(postId: number) {
    return queryOptions({
      queryKey: ['post', postId],
      queryFn: () => {
        return lastValueFrom(this.postsService.postById$(postId))
      },
    })
  }

  posts() {
    return queryOptions({
      queryKey: ['posts'],
      queryFn: () => lastValueFrom(this.postsService.allPosts$()),
    })
  }
}
