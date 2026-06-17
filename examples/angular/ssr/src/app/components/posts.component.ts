import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { lastValueFrom } from 'rxjs'
import { PostsService } from '../services/posts.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'posts',
  template: `
    @if (postsQuery.isPending()) {
      <p>Loading posts...</p>
    } @else if (postsQuery.isError()) {
      <p>Failed to load posts.</p>
    } @else {
      <section class="grid">
        @for (post of postsQuery.data(); track post.id) {
          <article class="card">
            <p class="meta">Post #{{ post.id }}</p>
            <h2>{{ post.title }}</h2>
            <p>{{ post.body }}</p>
          </article>
        }
      </section>
    }
  `,
  styles: `
    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .card {
      padding: 20px;
      border: 1px solid #eadfcb;
      border-radius: 18px;
      background: #fffdf8;
      box-shadow: 0 12px 30px rgba(123, 88, 31, 0.08);
    }

    .meta {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #8b5e34;
    }

    h2 {
      margin: 0 0 10px;
      font-size: 1.1rem;
      line-height: 1.3;
    }

    p {
      margin: 0;
      line-height: 1.5;
      color: #374151;
    }
  `,
})
export class PostsComponent {
  readonly #postsService = inject(PostsService)

  readonly postsQuery = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: () => lastValueFrom(this.#postsService.allPosts$()),
  }))
}
