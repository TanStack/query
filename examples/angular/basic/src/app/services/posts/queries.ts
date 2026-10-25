import { Injectable, inject } from '@angular/core'
import { queryOptions } from '@tanstack/angular-query-experimental'
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs'
import { PostsAPI } from './api'

@Injectable({
  providedIn: 'root',
})
export class PostsQueries {
  readonly #api = inject(PostsAPI)

  all = () => ['posts'] as const

  list = () =>
    queryOptions({
      queryKey: [...this.all(), 'list'] as const,
      queryFn: () => lastValueFrom(this.#api.getPosts()),
    })

  detail = (id: number) =>
    queryOptions({
      queryKey: [...this.all(), 'detail', id] as const,
      queryFn: (context) => {
        // Cancels the request when component is destroyed before the request finishes
        const abort$ = fromEvent(context.signal, 'abort')
        return lastValueFrom(this.#api.getPost(id).pipe(takeUntil(abort$)))
      },
    })
}
