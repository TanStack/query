import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { PostComponent } from './components/post.component'
import { PostsComponent } from './components/posts.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'basic-example',
  templateUrl: './app.component.html',
  imports: [PostComponent, PostsComponent],
})
export class BasicExampleComponent {
  readonly postId = signal(-1)
}
