import { ChangeDetectionStrategy, Component } from '@angular/core'
import { AutoRefetchingExampleComponent } from './components/auto-refetching.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  template: `<auto-refetching-example />`,
  imports: [AutoRefetchingExampleComponent],
})
export class AppComponent {}
