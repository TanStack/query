import { ChangeDetectionStrategy, Component } from '@angular/core'
import { SimpleExampleComponent } from './components/simple-example.component'

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SimpleExampleComponent],
  template: `<simple-example />`,
})
export class AppComponent {}
