import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'no-query',
  standalone: true,
  imports: [],
  template: ` <p>No query</p> `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoQueryComponent {
  constructor() {}
  ngOnInit(): void {}
}
