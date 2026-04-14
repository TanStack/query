# ADR-002: Error and Callback Semantics

## Status

Accepted

## Decision

- Mutation `mutate` swallows rejected promises by design, matching common TanStack adapter behavior for sync APIs.
- `mutateAsync` returns the underlying promise.
- Query refetch/suspense paths return promises and propagate fetch errors to callers.
- Callbacks are read from current options on host updates to reduce stale closure risk.

## Consequences

- Consumers choose sync (`mutate`) or async (`mutateAsync`) semantics explicitly.
