import { ChangeDetectionStrategy, Component } from '@angular/core'
import { OptimisticUpdatesComponent } from './components/optimistic-updates.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  template: `<optimistic-updates />`,
  imports: [OptimisticUpdatesComponent],
})
export class AppComponent {}
