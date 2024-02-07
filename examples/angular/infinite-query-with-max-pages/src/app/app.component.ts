import { ChangeDetectionStrategy, Component } from '@angular/core'
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import { ExampleComponent } from './components/example.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  template: `<example /><angular-query-devtools initialIsOpen />`,
  imports: [AngularQueryDevtools, ExampleComponent],
})
export class AppComponent {}
