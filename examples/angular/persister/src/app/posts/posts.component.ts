import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgStyle } from '@angular/common'
import {
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { PostsService } from './posts.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  standalone: true,
  templateUrl: './posts.component.html',
  imports: [RouterLink, NgStyle],
})
export default class PostsComponent {
  #postsService = inject(PostsService)

  postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: () => lastValueFrom(this.#postsService.allPosts$()),
  }))
  queryClient = injectQueryClient()
}
