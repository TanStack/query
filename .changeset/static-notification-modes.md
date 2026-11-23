---
'@tanstack/query-core': major
'@tanstack/react-query': major
'@tanstack/preact-query': major
'@tanstack/solid-query': major
'@tanstack/svelte-query': major
'@tanstack/vue-query': major
'@tanstack/lit-query': major
---

Limit `notifyOnChangeProps` to the static values `'all'` and `'none'`.

Replace `[]` with `'none'` to suppress observer notifications while the query stays subscribed and can fetch. Error changes still notify the observer when `throwOnError` is set. Keep `'all'` to receive every result change.

Remove property lists so adapters that track result reads can use their default behavior. Adapters that use their framework's reactivity receive the full result. Replace callbacks with a static value or omit the option to use the default. In React Native, use `subscribed: isFocused` if the screen can unsubscribe when it loses focus.
