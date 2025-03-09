import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  numberAttribute,
} from '@angular/core'
import { RouterLink } from '@angular/router'
import { injectQuery } from '@tanstack/angular-query'
import { QueriesService } from '../services/queries-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'post',
  templateUrl: './post.component.html',
  imports: [RouterLink],
})
export default class PostComponent {
  private readonly queries = inject(QueriesService)

  readonly postId = input.required({
    transform: numberAttribute,
  })

  readonly postQuery = injectQuery(() => this.queries.post(this.postId()))
}
