import { Component } from '@angular/core'
import { SimpleExampleComponent } from './components/simple-example.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SimpleExampleComponent],
  template: `<simple-example />`,
  styles: [],
})
export class AppComponent {}
