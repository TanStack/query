import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { QueryClient, getQueryData, injectQuery } from '@tanstack/angular-query'
import { PostsQueries } from '../services/posts/queries'

@Component({
  selector: 'posts',
  templateUrl: './posts.component.html',
  imports: [RouterLink],
})
export default class PostsComponent {
  readonly postsQueries = inject(PostsQueries)
  readonly postsQuery = injectQuery(() => this.postsQueries.list())
  private readonly queryClient = inject(QueryClient)

  protected isPostCached(id: number): boolean {
    return (
      getQueryData(this.queryClient, this.postsQueries.detail(id).queryKey) !==
      undefined
    )
  }
}
