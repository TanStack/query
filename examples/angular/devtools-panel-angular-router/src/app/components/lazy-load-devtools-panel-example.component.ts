import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core'
import { ExampleQueryComponent } from './example-query.component'
import type { ElementRef } from '@angular/core'
import type { DevtoolsPanelRef } from '@tanstack/angular-query-experimental/devtools-panel'

@Component({
  selector: 'lazy-load-devtools-panel-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <example-query />
    <h1>Lazy load devtools panel example</h1>
    <p>
      In this example, the devtools panel is loaded programmatically when the
      button is clicked. In addition, the code is lazy loaded.
    </p>
    <button type="button" (click)="toggleIsOpen()">
      {{ isOpen() ? 'Close' : 'Open' }} the devtools panel
    </button>
    @if (isOpen()) {
      <div #div style="height: 500px"></div>
    }
  `,
  imports: [ExampleQueryComponent],
})
export default class LazyLoadDevtoolsPanelExampleComponent {
  readonly isOpen = signal(false)
  readonly devtools = signal<Promise<DevtoolsPanelRef> | undefined>(undefined)
  readonly injector = inject(Injector)

  readonly divEl = viewChild<ElementRef>('div')
  readonly devToolsOptions = computed(() => ({
    hostElement: this.divEl(),
  }))

  toggleIsOpen() {
    this.isOpen.update((prev) => !prev)
  }

  readonly loadDevtoolsEffect = effect(() => {
    if (this.devtools()) return
    if (this.isOpen()) {
      this.devtools.set(
        import('@tanstack/angular-query-experimental/devtools-panel').then(
          ({ injectDevtoolsPanel }) =>
            injectDevtoolsPanel(this.devToolsOptions, {
              injector: this.injector,
            }),
        ),
      )
    }
  })
}
