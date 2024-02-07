import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  #http = inject(HttpClient)

  postById$ = (postId: number) =>
    this.#http.get<Post>(`https://jsonplaceholder.typicode.com/posts/${postId}`)

  allPosts$ = () =>
    this.#http.get<Array<Post>>('https://jsonplaceholder.typicode.com/posts')
}

export interface Post {
  id: number
  title: string
  body: string
}
