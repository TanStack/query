import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  signal,
} from '@angular/core'
import { ClientPersistDemoComponent } from './components/client-persist-demo.component'
import { PostsComponent } from './components/posts.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ssr-persist-example',
  imports: [ClientPersistDemoComponent, PostsComponent],
  template: `
    <main class="page">
      <header class="hero">
        <p class="eyebrow">Angular SSR + client-only island + persistence</p>
        <h1>SSR queries vs client-only persisted queries</h1>
        <p class="lede">
          Posts use <code>queryKey: ['posts']</code> and run on the server. Configure the
          persister with <code>dehydrateOptions.shouldDehydrateQuery</code> if you want only
          <code>client-persist</code> keys in <code>localStorage</code>.
        </p>
        <p class="lede hint">
          The panel below is mounted only in the browser via
          <code>afterNextRender</code>, so its query never runs during SSR. After the first
          visit, hard-reload: the timestamp can be restored from persistence while posts render
          from SSR again.
        </p>
      </header>

      <section class="region">
        <h2 class="region-title">Server data</h2>
        <posts />
      </section>

      <section class="region">
        <h2 class="region-title">Client-only (afterNextRender)</h2>
        @if (showClientDemo()) {
          <client-persist-demo />
        } @else {
          <p class="placeholder">
            Server render: this placeholder has no <code>client-persist-demo</code> component
            yet — it is created after the first browser frame via <code>afterNextRender</code>.
          </p>
        }
      </section>
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
      margin: 0 0 12px;
      font-size: 1rem;
      line-height: 1.6;
      color: #4b5563;
    }

    .hint {
      font-size: 0.95rem;
      color: #6b7280;
    }

    code {
      font-size: 0.88em;
      padding: 0.1em 0.35em;
      border-radius: 4px;
      background: #f3f4f6;
    }

    .region {
      margin-bottom: 40px;
    }

    .region-title {
      margin: 0 0 16px;
      font-size: 1.25rem;
      color: #1f2937;
    }

    .placeholder {
      margin: 0;
      padding: 16px;
      border-radius: 12px;
      background: #f9fafb;
      color: #6b7280;
      line-height: 1.5;
    }
  `,
})
export class SsrPersistExampleComponent {
  /** When `true`, `ClientPersistDemoComponent` exists only in the browser (not during SSR). */
  readonly showClientDemo = signal(false)

  constructor() {
    afterNextRender(() => {
      this.showClientDemo.set(true)
    })
  }
}
