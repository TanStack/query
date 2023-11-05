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
      <ng-container *ngIf="postQuery().status === 'pending'">
        Loading...
      </ng-container>
      <ng-container *ngIf="postQuery().status === 'error'">
        Error: {{ postQuery().error?.message }}
      </ng-container>
      <ng-container *ngIf="postQuery().data as post">
        <h1>{{ post.title }}</h1>
        <div>
          <p>{{ post.body }}</p>
        </div>
        <div *ngIf="postQuery().isFetching">Background Updating...</div>
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

  // You can even leave out the queryFn and just go straight into options
  postQuery = injectQuery<Post>(() => ({
    enabled: this.postIdSignal() > 0,
    queryKey: [`/posts/${this.postIdSignal()}`],
  }))

  queryClient = injectQueryClient
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  standalone: true,
  template: `<div>
    <h1>Posts</h1>
    <div [ngSwitch]="postsQuery().status">
      <div *ngSwitchCase="'pending'">Loading...</div>
      <div *ngSwitchCase="'error'">
        Error: {{ postsQuery().error?.message }}
      </div>
      <ng-container *ngSwitchDefault>
        <p *ngFor="let post of postsQuery().data">
          <!--          We can access the query data here to show bold links for-->
          <!--          ones that are cached-->
          <a
            href="#"
            (click)="setPostId.emit(post.id)"
            [style]="queryClient.getQueryData(['post', post.id])
                        ? {
                            fontWeight: 'bold',
                            color: 'green',
                          }
                        : {}
                    "
            >{{ post.title }}</a
          >
        </p>
      </ng-container>

      <div *ngIf="postsQuery().isFetching">Background Updating...</div>
    </div>
  </div>`,
  imports: [CommonModule],
})
export class PostsComponent {
  @Output() setPostId = new EventEmitter<number>()

  // All you have to do now is pass a key!
  postsQuery = injectQuery<Array<Post>>(() => ({
    queryKey: ['/posts'],
  }))

  queryClient = injectQueryClient()
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'default-query-function-example',
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
export class DefaultQueryFunctionExampleComponent {
  postId = signal(-1)
}
