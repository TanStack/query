import { ChangeDetectionStrategy, Component } from '@angular/core'
import { PostsComponent } from './components/posts.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ssr-example',
  imports: [PostsComponent],
  template: `
    <main class="page">
      <header class="hero">
        <p class="eyebrow">Angular SSR</p>
        <h1>Server-rendered posts with TanStack Query</h1>
        <p class="lede">
          The first render comes from the server. Angular then hydrates the app
          on the client and TanStack Query continues from a fresh client cache.
        </p>
      </header>

      <posts />
    </main>
  `,
  styles: `
    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }

    .hero {
      margin-bottom: 32px;
    }

    .eyebrow {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #9b5c00;
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(2.2rem, 5vw, 4rem);
      line-height: 1;
    }

    .lede {
      max-width: 640px;
      margin: 0;
      font-size: 1rem;
      line-height: 1.6;
      color: #4b5563;
    }
  `,
})
export class SsrExampleComponent {}
