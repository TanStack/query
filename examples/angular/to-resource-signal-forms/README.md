# TanStack Query Angular `toResource` with Signal Forms example

This example uses Angular Signal Forms' `validateAsync` with a Resource created
from `injectQuery` and `toResource`. The username check is cached by its query
key, debounced while typing, and cancelled when the value changes. The example
also adds an invite-code field dynamically, giving it its own async validator,
and includes a button that calls Signal Forms' `reloadValidation()` API. The
invite-code validator is applied with `applyEach`, so its Resource factory is
created only when an invite-code item is added to the form array. Query keys and
request options live in `ValidationQueriesService`; the validators spread those
options and add `enabled` based on the current field value.
Submitting the form runs a mock `injectMutation`, disables the submit button while it is pending,
and displays the variables passed to the mutation.

This example intentionally uses Angular 22 because Signal Forms' `validateAsync`
API is stable starting in Angular 22.

To run this example:

- `pnpm install`
- `pnpm start`
