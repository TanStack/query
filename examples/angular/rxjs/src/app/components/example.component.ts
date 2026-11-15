import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms'
import {
  injectQuery,
  keepPreviousData,
} from '@tanstack/angular-query-experimental'
import { debounceTime, distinctUntilChanged } from 'rxjs'
import { SuggestionsQueries } from '../services/suggestions/queries'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'example',
  templateUrl: './example.component.html',
  imports: [ReactiveFormsModule],
})
export class ExampleComponent {
  readonly #suggestionsQueries = inject(SuggestionsQueries)
  readonly #fb = inject(NonNullableFormBuilder)

  readonly form = this.#fb.group({
    term: '',
  })

  readonly term = toSignal(
    this.form.controls.term.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  )

  readonly query = injectQuery(() => ({
    ...this.#suggestionsQueries.list(this.term()),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }))
}
