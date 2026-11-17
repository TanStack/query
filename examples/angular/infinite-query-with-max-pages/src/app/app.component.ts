import { Component } from '@angular/core'
import { ExampleComponent } from './components/example.component'

@Component({
  selector: 'app-root',
  template: `<example />`,
  imports: [ExampleComponent],
})
export class AppComponent {}
