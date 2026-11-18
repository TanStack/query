import { Component, signal } from '@angular/core'
import { PostComponent } from './components/post.component'
import { PostsComponent } from './components/posts.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [PostComponent, PostsComponent],
})
export class AppComponent {
  readonly postId = signal(-1)
}
