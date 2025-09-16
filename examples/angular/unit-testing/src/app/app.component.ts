import { ChangeDetectionStrategy, Component } from '@angular/core'
import { UnitTestingComponent } from './components/unit-testing.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  template: `<unit-testing />`,
  imports: [UnitTestingComponent],
})
export class AppComponent {}
