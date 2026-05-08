import { Injectable } from '@angular/core'
import { of, tap } from 'rxjs'
import { delay } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  allPosts$ = () =>
    of(posts).pipe(
      tap(() => console.log('fetching posts')),
      delay(50),
    )
}

export interface Post {
  id: number
  title: string
  body: string
}

const posts: Array<Post> = [
  {
    id: 1,
    title: 'Render on the server',
    body: 'The initial HTML is produced by Angular SSR before the browser bootstraps the app.',
  },
  {
    id: 2,
    title: 'Hydrate on the client',
    body: 'Angular reuses the rendered DOM and turns it into a live client application.',
  },
  {
    id: 3,
    title: 'Query on both sides',
    body: 'TanStack Query resolves during server rendering here, then the browser starts with a fresh client cache.',
  },
  {
    id: 4,
    title: 'No API needed',
    body: 'This example uses a deterministic in-memory data source so the SSR example works without external network access.',
  },
  {
    id: 5,
    title: 'Keep the setup small',
    body: 'Only the Angular CLI SSR pieces remain: main.server.ts, server.ts and the server application config.',
  },
  {
    id: 6,
    title: 'Match the other examples',
    body: 'The rest of the app keeps the same lightweight structure as the existing Angular examples in this repo.',
  },
]
