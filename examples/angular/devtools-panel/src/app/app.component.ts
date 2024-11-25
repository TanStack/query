import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink, RouterOutlet } from '@angular/router'
import { ExampleQueryComponent } from './components/example-query.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  template: `
    <ul>
      <li>
        <a routerLink="basic">Basic devtools panel example</a>
      </li>
      <li>
        <a routerLink="lazy">Lazy load devtools panel example</a>
      </li>
    </ul>

    <router-outlet />
  `,
  imports: [ExampleQueryComponent, RouterOutlet, RouterLink],
})
export class AppComponent {}
