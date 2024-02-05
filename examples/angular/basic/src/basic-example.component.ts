import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { PostComponent } from './post.component'
import { PostsComponent } from './posts.component'

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
