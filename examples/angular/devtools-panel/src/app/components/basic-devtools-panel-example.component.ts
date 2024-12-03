import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core'
import { injectDevtoolsPanel } from '@tanstack/angular-query-devtools-experimental'
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
    <button type="button" (click)="isOpen = !isOpen">
      {{ isOpen ? 'Close' : 'Open' }} the devtools panel
    </button>
    @if (isOpen) {
      <div #div style="height: 500px"></div>
    }
  `,
  imports: [ExampleQueryComponent],
})
export default class BasicDevtoolsPanelExampleComponent {
  isOpen = false
  divEl = viewChild<ElementRef>('div')

  devtools = injectDevtoolsPanel(() => ({
    hostElement: this.divEl(),
  }))
}
