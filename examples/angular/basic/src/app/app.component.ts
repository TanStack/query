import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { PostComponent } from './components/post.component'
import { PostsComponent } from './components/posts.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'basic-example',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [AngularQueryDevtools, PostComponent, PostsComponent],
})
export class BasicExampleComponent {
  postId = signal(-1)
}
