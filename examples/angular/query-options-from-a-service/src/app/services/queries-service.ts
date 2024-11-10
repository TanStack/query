import { Injectable, inject } from '@angular/core'
import { lastValueFrom } from 'rxjs'
import { queryOptions } from '@tanstack/angular-query-experimental'
import { HttpClient } from '@angular/common/http'

export interface Post {
  id: number
  title: string
  body: string
}

@Injectable({
  providedIn: 'root',
})
export class QueriesService {
  private http = inject(HttpClient)

  post(postId: number) {
    return queryOptions({
      queryKey: ['post', postId],
      queryFn: () => {
        return lastValueFrom(
          this.http.get<Post>(
            `https://jsonplaceholder.typicode.com/posts/${postId}`,
          ),
        )
      },
    })
  }

  posts() {
    return queryOptions({
      queryKey: ['posts'],
      queryFn: () =>
        lastValueFrom(
          this.http.get<Array<Post>>(
            'https://jsonplaceholder.typicode.com/posts',
          ),
        ),
    })
  }
}
