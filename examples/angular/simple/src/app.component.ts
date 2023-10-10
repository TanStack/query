import { NgIf } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { UseQueryClient } from '@tanstack/angular-query-experimental'
import { AngularQueryDevtoolsComponent } from '@tanstack/angular-query-devtools-experimental'
import { HasQueryComponent } from './has-query.component'
import { NoQueryComponent } from './no-query.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NoQueryComponent,
    HasQueryComponent,
    NgIf,
    AngularQueryDevtoolsComponent,
  ],
  template: `<angular-query-devtools initialIsOpen="false" />
    <button (click)="showsQueryComponent = !showsQueryComponent">
      Toggle component with query
    </button>
    <no-query *ngIf="!showsQueryComponent" />
    <has-query *ngIf="showsQueryComponent" />`,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  useQueryClient = inject(UseQueryClient)
  public showsQueryComponent = true
}
