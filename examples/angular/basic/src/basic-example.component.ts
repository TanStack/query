import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core'
import {
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental'
import { HttpClient } from '@angular/common/http'
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs'

type Post = {
  id: number
  title: string
  body: string
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  standalone: true,
  template: `
    <div>
      <div>
        <a (click)="setPostId.emit(-1)" href="#"> Back </a>
      </div>
      @if (postQuery.status() === 'pending') {
        Loading...
      } @else if (postQuery.status() === 'error') {
        Error: {{ postQuery.error()?.message }}
      }
      @if (postQuery.data(); as post) {
        <h1>{{ post.title }}</h1>
        <div>
          <p>{{ post.body }}</p>
        </div>
        @if (postQuery.isFetching()) {
          Background Updating...
        }
      }
    </div>
  `,
})
export class PostComponent {
  @Output() setPostId = new EventEmitter<number>()

  // Until Angular supports signal-based inputs, we have to set a signal
  @Input({ required: true, alias: 'postId' })
  set _postId(value: number) {
    this.postId.set(value)
  }
  postId = signal(0)
  httpClient = inject(HttpClient)

  getPost$ = (postId: number) => {
    return this.httpClient.get<Post>(
      `https://jsonplaceholder.typicode.com/posts/${postId}`,
    )
  }

  postQuery = injectQuery(() => ({
    enabled: this.postId() > 0,
    queryKey: ['post', this.postId()],
    queryFn: async (context): Promise<Post> => {
      // Cancels the request when component is destroyed before the request finishes
      const abort$ = fromEvent(context.signal, 'abort')
      return lastValueFrom(this.getPost$(this.postId()).pipe(takeUntil(abort$)))
    },
  }))

  queryClient = injectQueryClient()
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  standalone: true,
  template: `<div>
    <h1>Posts</h1>
    @switch (postsQuery.status()) {
      @case ('pending') {
        Loading...
      }
      @case ('error') {
        Error: {{ postsQuery.error()?.message }}
      }
      @default {
        <div class="todo-container">
          @for (post of postsQuery.data(); track post.id) {
            <p>
              <!--          We can access the query data here to show bold links for-->
              <!--          ones that are cached-->
              <a
                href="#"
                (click)="setPostId.emit(post.id)"
                [style]="
                  queryClient.getQueryData(['post', post.id])
                    ? {
                        fontWeight: 'bold',
                        color: 'green'
                      }
                    : {}
                "
                >{{ post.title }}</a
              >
            </p>
          }
        </div>
      }
    }
    <div>
      @if (postsQuery.isFetching()) {
        Background Updating...
      }
    </div>
  </div> `,
})
export class PostsComponent {
  @Output() setPostId = new EventEmitter<number>()

  posts$ = inject(HttpClient).get<Array<Post>>(
    'https://jsonplaceholder.typicode.com/posts',
  )

  postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: () => lastValueFrom(this.posts$),
  }))

  queryClient = injectQueryClient()
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'basic-example',
  standalone: true,
  template: `
    <p>
      As you visit the posts below, you will notice them in a loading state the
      first time you load them. However, after you return to this list and click
      on any posts you have already visited again, you will see them load
      instantly and background refresh right before your eyes!
      <strong>
        (You may need to throttle your network speed to simulate longer loading
        sequences)
      </strong>
    </p>
    <angular-query-devtools initialIsOpen />
    @if (postId() > -1) {
      <post [postId]="postId()" (setPostId)="postId.set($event)"></post>
    } @else {
      <posts (setPostId)="postId.set($event)" />
    }
  `,
  imports: [AngularQueryDevtools, PostComponent, PostsComponent],
})
export class BasicExampleComponent {
  postId = signal(-1)
}
