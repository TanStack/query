# TanStack Angular Query toResource Signal Forms Example

A registration form that validates the username and invite codes with queries, through Signal Forms' `validateAsync`.

## How it works

- `src/app/validation-queries.service.ts` is an `@Injectable` `ValidationQueriesService` whose `usernameAvailability(username)` and `inviteCodeValidation(code)` return `queryOptions`, and whose `submitRegistration()` returns `mutationOptions`. All three use mock requests.
- `src/app/app.component.ts` passes a `factory` to `validateAsync` that creates a query with `injectQuery` and returns `toResource(query)`. Results are cached by query key, and the query is `enabled` only when the field has a value.
- The invite-code validator is added with `applyEach`, so its query is created only when an invite code is added to the form array.
- The fields use `debounce(path, 300)` from `@angular/forms/signals` because the `debounce` option of `validateAsync` does not work with `toResource(query)` ([angular/angular#70884](https://github.com/angular/angular/issues/70884)). Blurring a field or submitting the form applies a pending update immediately.
- Submitting calls `registrationMutation.mutateAsync` from `injectMutation` inside Signal Forms' `submit`, and maps the errors the mutation returns to their fields. The "Request validation again" button calls `reloadValidation()`.

Signal Forms' `validateAsync` is stable from Angular 22, so this example needs Angular 22.

To run this example:

- `npm install`
- `npm start`
