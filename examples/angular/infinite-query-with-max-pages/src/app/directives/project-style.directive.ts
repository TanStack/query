import { Directive, HostBinding, Input } from '@angular/core'

@Directive({
  selector: '[projectStyle]',
})
export class ProjectStyleDirective {
  @Input({ required: true }) projectStyle!: number

  @HostBinding('style') get style() {
    return `
      border: 1px solid gray;
      border-radius: 5px;
      padding: 8px;
      font-size: 14px;
      background: hsla(${this.projectStyle * 30}, 60%, 80%, 1);
    `
  }
}
