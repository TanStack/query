import { AngularQueryDevtoolsComponent } from '@tanstack/angular-query-devtools-experimental'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core'
import { CommonModule, NgIf } from '@angular/common'
import {
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental'
import axios from 'axios'

type Post = {
  id: number
  title: string
  body: string
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  standalone: true,
  imports: [NgIf],
  template: `
    <div>
      <div>
        <a (click)="setPostId.emit(-1)" href="#"> Back </a>
      </div>
      <ng-container *ngIf="postQuery.status() === 'pending'">
        Loading...
      </ng-container>
      <ng-container *ngIf="postQuery.status() === 'error'">
        Error: {{ postQuery.error()?.message }}
      </ng-container>
      <ng-container *ngIf="postQuery.data() as post">
        <h1>{{ post.title }}</h1>
        <div>
          <p>{{ post.body }}</p>
        </div>
        <div *ngIf="postQuery.isFetching()">Background Updating...</div>
      </ng-container>
    </div>
  `,
})
export class PostComponent {
  @Output() setPostId = new EventEmitter<number>()

  // Until Angular supports signal-based inputs, we have to set a signal
  @Input({ required: true })
  set postId(value: number) {
    this.postIdSignal.set(value)
  }
  postIdSignal = signal<number>(0)
  postQuery = injectQuery(() => ({
    enabled: this.postIdSignal() > 0,
    queryKey: ['post', this.postIdSignal()],
    queryFn: async (): Promise<Post> => {
      const { data } = await axios.get(
        `https://jsonplaceholder.typicode.com/posts/${this.postIdSignal()}`,
      )
      return data
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
    <div [ngSwitch]="postsQuery.status()">
      <div *ngSwitchCase="'pending'">Loading...</div>
      <div *ngSwitchCase="'error'">
        Error: {{ postsQuery.error()?.message }}
      </div>
      <ng-container *ngSwitchDefault>
        <p *ngFor="let post of postsQuery.data()">
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
      </ng-container>

      <div *ngIf="postsQuery.isFetching()">Background Updating...</div>
    </div>
  </div>`,
  imports: [CommonModule],
})
export class PostsComponent {
  @Output() setPostId = new EventEmitter<number>()

  postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: async (): Promise<Array<Post>> => {
      const { data } = await axios.get(
        'https://jsonplaceholder.typicode.com/posts',
      )
      return data
    },
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
    <div *ngIf="postId() > -1; else posts">
      <post [postId]="postId()" (setPostId)="postId.set($event)"></post>
    </div>
    <ng-template #posts>
      <posts (setPostId)="postId.set($event)" />
    </ng-template>
  `,
  imports: [AngularQueryDevtoolsComponent, NgIf, PostComponent, PostsComponent],
})
export class BasicExampleComponent {
  postId = signal(-1)
}
