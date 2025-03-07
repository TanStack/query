import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  computed,
  inject,
  viewChild,
} from '@angular/core'
import { ExampleQueryComponent } from './example-query.component'
import type { ElementRef } from '@angular/core'
import type { DevtoolsPanelRef } from '@tanstack/angular-query-devtools-experimental'

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
    <button type="button" (click)="toggleDevtools()">
      {{ isOpen ? 'Close' : 'Open' }} the devtools panel
    </button>
    @if (isOpen) {
      <div #div style="height: 500px"></div>
    }
  `,
  imports: [ExampleQueryComponent],
})
export default class LazyLoadDevtoolsPanelExampleComponent {
  isOpen = false
  devtools?: Promise<DevtoolsPanelRef>
  injector = inject(Injector)

  divEl = viewChild<ElementRef>('div')
  devToolsOptions = computed(() => ({
    hostElement: this.divEl(),
  }))

  toggleDevtools() {
    this.isOpen = !this.isOpen
    if (!this.devtools) {
      this.devtools = import(
        '@tanstack/angular-query-devtools-experimental'
      ).then(({ injectDevtoolsPanel }) =>
        injectDevtoolsPanel(this.devToolsOptions, this.injector),
      )
    }
  }
}
