import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { Post } from './types'

@Injectable({
  providedIn: 'root',
})
export class PostsAPI {
  readonly #http = inject(HttpClient)

  getPosts = () =>
    this.#http.get<Array<Post>>('https://jsonplaceholder.typicode.com/posts')

  getPost = (id: number) =>
    this.#http.get<Post>(`https://jsonplaceholder.typicode.com/posts/${id}`)
}
