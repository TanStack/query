# ADR-003: Options Reactivity Contract

## Status

Accepted

## Decision

- Options accept `Accessor<T>` (`T` or `() => T`).
- Accessors are re-evaluated in `hostUpdate`.
- Controller refreshes observer options on each host update using QueryClient defaulting.
- Query key/option identity changes are handled through observer `setOptions`/`setQueries`.

## Consequences

- Option updates stay aligned with Lit render cycles.
- Consumers should call `requestUpdate()` when option dependencies change outside reactive fields.
