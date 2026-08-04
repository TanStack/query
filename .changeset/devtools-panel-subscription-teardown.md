---
"@tanstack/query-devtools": patch
---

fix(devtools): keep other panels subscribed when one panel unmounts

The subscriber registries for the query and mutation caches are shared by every
devtools instance on the page, but a panel's teardown cleared them entirely
instead of removing only its own entries. When two panels were mounted at once
- during the picture-in-picture transition, or when the standalone panel is used
alongside the floating one - tearing one down unsubscribed the other, leaving
its list, status counts and details pane permanently frozen. Each subscription
already removes its own entry on disposal, so the registry-wide clear was
redundant as well as harmful and has been removed.
