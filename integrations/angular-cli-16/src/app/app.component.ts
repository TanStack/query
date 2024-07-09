import { ChangeDetectionStrategy, Component } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="query.isPending()">Loading...</div>
    <div *ngIf="query.error()">An error has occurred!</div>
    <div *ngIf="query.data()">
      {{ query.data() }}
    </div>
    <angular-query-devtools initialIsOpen />
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  /**
   * @public
   */
  query = injectQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return 'Data'
    },
  }))
}
