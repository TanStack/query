import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CreateQuery } from '@tanstack/angular-query-experimental'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app',
  standalone: true,
  template: `
    <ng-container *ngIf="query().isPending">Loading...</ng-container>
    <ng-container *ngIf="query().error"> An error has occurred! </ng-container>
    <div *ngIf="query().data as data">
      {{ data }}
    </div>
  `,
  imports: [CommonModule],
})
export class AppComponent {
  query = inject(CreateQuery)(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return 'Success'
    },
  }))
}
