import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DynamicDevtoolsExampleComponent } from './components/dynamic-devtools-example.component'

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamicDevtoolsExampleComponent],
  template: `<dynamic-devtools-example />`,
})
export class AppComponent {}
