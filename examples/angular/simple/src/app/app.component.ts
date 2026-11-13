import { Component } from '@angular/core'
import { SimpleExampleComponent } from './components/simple-example.component'

@Component({
  selector: 'app-root',
  imports: [SimpleExampleComponent],
  template: `<simple-example />`,
})
export class AppComponent {}
