import { ChangeDetectionStrategy, Component } from '@angular/core'
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import { injectQuery } from '@tanstack/angular-query-experimental'

@Component({
  selector: 'app-root',
  template: `
    @if (query.isPending()) {
      <div>Loading...</div>
    }
    @if (query.isError()) {
      An error has occurred!
    }
    @if (query.data()) {
      {{ query.data() }}
    }
    <angular-query-devtools initialIsOpen />
  `,
  styles: [],
  standalone: true,
  imports: [AngularQueryDevtools],
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
