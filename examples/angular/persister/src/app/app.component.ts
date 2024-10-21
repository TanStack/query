import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import { injectIsRestoring } from '@tanstack/angular-query-experimental'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'root',
  standalone: true,
  template: `
    <h1>Angular Query - Persister</h1>
    <p>
      Try to mock offline behavior with the button in the devtools. You can
      navigate around as long as there is already data in the cache. You'll get
      a refetch as soon as you go "online" again.
    </p>
    <router-outlet />
    <angular-query-devtools initialIsOpen />
  `,
  imports: [AngularQueryDevtools, RouterOutlet],
})
export class AppComponent {
  isRestoring = injectIsRestoring()
}
