import { ChangeDetectionStrategy, Component } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { CLIENT_PERSIST_QUERY_ROOT } from '../query-persist-scope'

/**
 * Mounted only in the browser (parent uses `afterNextRender`), so `queryFn` is not run during SSR.
 * Pair with `dehydrateOptions.shouldDehydrateQuery` if you want only `client-persist` keys in storage.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'client-persist-demo',
  template: `
    <div class="panel">
      <p class="badge">Client-only island</p>
      <h3>Client-only persisted query</h3>
      @if (demo.isPending()) {
        <p>Loading client-only data…</p>
      } @else if (demo.isError()) {
        <p>Failed to load.</p>
      } @else if (demo.data(); as data) {
        <p class="mono">{{ data.createdAt }}</p>
        <p class="note">
          This value is stored under the <code>client-persist</code> query key. Hard-reload the
          page: it should reappear from persistence while the posts list above is rendered from
          SSR again.
        </p>
      }
    </div>
  `,
  styles: `
    .panel {
      margin-top: 8px;
      padding: 20px;
      border-radius: 18px;
      border: 1px dashed #c4b5a0;
      background: #fffefb;
    }

    .badge {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #7c5a10;
    }

    h3 {
      margin: 0 0 12px;
      font-size: 1.1rem;
    }

    .mono {
      margin: 0 0 12px;
      font-family: ui-monospace, monospace;
      font-size: 0.85rem;
      word-break: break-all;
    }

    .note {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #4b5563;
    }

    code {
      font-size: 0.88em;
      padding: 0.1em 0.35em;
      border-radius: 4px;
      background: #f3f4f6;
    }
  `,
})
export class ClientPersistDemoComponent {
  readonly demo = injectQuery(() => ({
    queryKey: [CLIENT_PERSIST_QUERY_ROOT, 'timestamp-demo'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 100))
      return { createdAt: new Date().toISOString() }
    },
    staleTime: Infinity,
  }))
}
