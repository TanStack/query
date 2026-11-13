import { Component } from '@angular/core'
import { DynamicDevtoolsExampleComponent } from './components/dynamic-devtools-example.component'

@Component({
  selector: 'app-root',
  imports: [DynamicDevtoolsExampleComponent],
  template: `<dynamic-devtools-example />`,
})
export class AppComponent {}
