import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink, RouterOutlet } from '@angular/router'

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
  imports: [RouterOutlet, RouterLink],
})
export class AppComponent {}
