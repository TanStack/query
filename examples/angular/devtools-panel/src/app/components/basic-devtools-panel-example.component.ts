import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core'
import { injectDevtoolsPanel } from '@tanstack/angular-query-devtools-experimental'
import { ExampleQueryComponent } from './example-query.component'
import type { ElementRef } from '@angular/core'

@Component({
  standalone: true,
  selector: 'basic-devtools-panel-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <example-query />
    <h1>Basic devtools panel example</h1>
    <p>
      In this example, the devtools panel is loaded programmatically when the
      button is clicked
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
export default class BasicDevtoolsPanelExampleComponent {
  isOpen = signal(false)
  divEl = viewChild<ElementRef>('div')

  toggleDevtools() {
    this.isOpen.update((prev) => !prev)
  }

  devtools = injectDevtoolsPanel(() => ({
    hostElement: this.divEl(),
  }))
}
