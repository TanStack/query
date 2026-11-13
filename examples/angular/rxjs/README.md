# TanStack Angular Query RxJS Example

An autocomplete that debounces input with RxJS and keeps the previous results with `keepPreviousData`.

## How it works

- `src/app/services/suggestions/queries.ts` is an `@Injectable` `SuggestionsQueries` whose `list(term)` returns `queryOptions` keyed by `['suggestions', 'list', term]`. `src/app/services/suggestions/api.ts` returns an empty list for a blank term without making a request.
- `src/app/components/example.component.ts` pipes the form control's `valueChanges` through `debounceTime(300)` and `distinctUntilChanged()`, and turns the result into the `term` signal with `toSignal`.
- `src/app/components/example.component.ts` then spreads `list(this.term())` into `injectQuery` with `placeholderData: keepPreviousData` and a 5-minute `staleTime`, so the previous suggestions stay on screen while the next term loads.
- `src/app/api/autocomplete-mock.interceptor.ts` is an `HttpInterceptorFn`, registered with `withInterceptors` in `src/app/app.config.ts`, that answers `/api/autocomplete` with the programming languages starting with the term after 100 to 500 ms.

To run this example:

- `npm install`
- `npm start`
