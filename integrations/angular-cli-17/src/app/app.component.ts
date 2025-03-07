import { ChangeDetectionStrategy, Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { injectQuery } from '@tanstack/angular-query-experimental'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  template: `
    <div *ngIf="query.isPending()">Loading...</div>
    <div *ngIf="query.error()">An error has occurred!</div>
    <div *ngIf="query.data()">
      {{ query.data() }}
    </div>
  `,
  imports: [CommonModule],
})
export class AppComponent {
  /**
   * @public
   */
  query = injectQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return 'Success'
    },
  }))
}
