import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms'
import { injectQuery, keepPreviousData } from '@tanstack/angular-query'
import { debounceTime, distinctUntilChanged, lastValueFrom } from 'rxjs'
import { AutocompleteService } from '../services/autocomplete-service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'example',
  templateUrl: './example.component.html',
  imports: [ReactiveFormsModule],
})
export class ExampleComponent {
  readonly #autocompleteService = inject(AutocompleteService)
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
    queryKey: ['suggestions', this.term()],
    queryFn: () => {
      return lastValueFrom(
        this.#autocompleteService.getSuggestions(this.term()),
      )
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  }))
}
