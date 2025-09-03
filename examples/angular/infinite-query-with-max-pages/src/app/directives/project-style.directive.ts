import { Directive, computed, input } from '@angular/core'

@Directive({
  selector: '[projectStyle]',
  host: {
    '[style]': 'style()',
  },
})
export class ProjectStyleDirective {
  readonly projectStyle = input.required<number>()

  readonly style = computed(
    () =>
      `
      border: 1px solid gray;
      border-radius: 5px;
      padding: 8px;
      font-size: 14px;
      background: hsla(${this.projectStyle() * 30}, 60%, 80%, 1);
    `,
  )
}
