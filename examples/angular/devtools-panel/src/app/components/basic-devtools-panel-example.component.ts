import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core'
import { injectDevtoolsPanel } from '@tanstack/angular-query-devtools'
import { ExampleQueryComponent } from './example-query.component'
import type { ElementRef } from '@angular/core'

@Component({
  selector: 'basic-devtools-panel-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <example-query />
    <h1>Basic devtools panel example</h1>
    <p>
      In this example, the devtools panel is loaded programmatically when the
      button is clicked
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
export default class BasicDevtoolsPanelExampleComponent {
  readonly isOpen = signal(false)
  readonly divEl = viewChild<ElementRef>('div')

  toggleIsOpen() {
    this.isOpen.update((prev) => !prev)
  }

  readonly devtools = injectDevtoolsPanel(() => ({
    hostElement: this.divEl(),
  }))
}
