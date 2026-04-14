# ADR-001: Controller Lifecycle and Update Scheduling

## Status

Accepted

## Decision

- Controllers subscribe to TanStack observers in `hostConnected`.
- Controllers unsubscribe in `hostDisconnected`.
- Repeated connect/disconnect cycles are idempotent and must not create duplicate subscriptions.
- Host updates are coalesced through `queueMicrotask` + `host.requestUpdate()`.
- Queued microtasks must not call `requestUpdate()` after controller `destroy()`.
- Context consumer callbacks must be ignored after controller `destroy()`.
- Destroy path must explicitly tear down context consumer subscriptions.

## Consequences

- Components can detach/reattach safely.
- Observer callbacks remain single-subscribed.
