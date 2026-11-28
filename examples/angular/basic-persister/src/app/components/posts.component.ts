import { Component, inject, output } from '@angular/core'
import { QueryClient, getQueryData, injectQuery } from '@tanstack/angular-query'
import { PostsQueries } from '../services/posts/queries'

@Component({
  selector: 'posts',
  templateUrl: './posts.component.html',
})
export class PostsComponent {
  private readonly queryClient = inject(QueryClient)
  readonly postsQueries = inject(PostsQueries)
  readonly setPostId = output<number>()

  readonly postsQuery = injectQuery(() => this.postsQueries.list())

  protected isPostCached(id: number): boolean {
    return (
      getQueryData(this.queryClient, this.postsQueries.detail(id).queryKey) !==
      undefined
    )
  }
}
