import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core'
import { ExampleQueryComponent } from './example-query.component'
import type { ElementRef } from '@angular/core'
import type { DevtoolsPanelRef } from '@tanstack/angular-query-devtools-experimental'

@Component({
  standalone: true,
  selector: 'lazy-load-devtools-panel-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <example-query />
    <h1>Lazy load devtools panel example</h1>
    <p>
      In this example, the devtools panel is loaded programmatically when the
      button is clicked. In addition, the code is lazy loaded
    </p>
    <button type="button" (click)="toggleDevtools()">
      {{ isOpen() ? 'Close' : 'Open' }} the devtools panel
    </button>
    @if (isOpen()) {
      <div #div style="height: 500px"></div>
    }
  `,
  imports: [ExampleQueryComponent],
})
export default class LazyLoadDevtoolsPanelExampleComponent {
  isOpen = signal(false)
  divEl = viewChild<ElementRef>('div')
  devtools?: DevtoolsPanelRef
  injector = inject(Injector)

  toggleDevtools() {
    this.isOpen.update((prev) => !prev)
  }

  constructor() {
    effect(() => {
      const isOpen = this.isOpen()
      if (!isOpen || this.devtools) return
      void this.lazyInitDevtools()
    })
  }

  async lazyInitDevtools() {
    // As the import is dynamic, it will not be included in the main bundle
    // and will be lazy loaded only when the button is clicked
    // Instead of a button you could also define a keyboard shortcut to
    // load the devtools panel on demand
    const { injectDevtoolsPanel } = await import(
      '@tanstack/angular-query-devtools-experimental'
    )
    this.devtools = injectDevtoolsPanel(
      () => ({
        hostElement: this.divEl(),
      }),
      this.injector,
    )
  }
}
