import { ChangeDetectionStrategy, Component } from '@angular/core'
import { UserPreferencesComponent } from './components/user-preferences.component'
import { SessionDataComponent } from './components/session-data.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">
          TanStack Query Persistence Demo
        </h1>
        <p class="text-gray-600 mb-4 leading-relaxed">
          This demo illustrates how to selectively persist queries to different
          persisters. By leveraging shouldDehydrateQuery, it is possible to
          strategically cache data in multiple persisters based on specific
          query requirements.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <user-preferences />
          <session-data />
        </div>
      </div>
    </div>
  `,
  imports: [UserPreferencesComponent, SessionDataComponent],
})
export class AppComponent {}
