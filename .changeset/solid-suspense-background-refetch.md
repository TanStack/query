---
'@tanstack/solid-query': patch
---

Stop background refetches and cached-data mounts from re-triggering enclosing `<Suspense>` boundaries. Every observer update used to pass through the resource's Promise path, suspending the boundary for a microtask — which detached and re-inserted its DOM, restarting CSS animations and resetting focus/scroll/iframe state even though no fallback was ever painted. Queries now resolve synchronously when data is available, so Suspense only triggers on genuine initial loads.
