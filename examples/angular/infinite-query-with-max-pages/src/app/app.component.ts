import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ExampleComponent } from './components/example.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  template: `<example />`,
  imports: [ExampleComponent],
})
export class AppComponent {}
