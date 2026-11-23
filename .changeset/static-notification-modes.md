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

For non-empty lists or callbacks, omit the option to use the adapter's default or choose a static value. In React Native, use `subscribed: isFocused` if the screen can unsubscribe when it loses focus.
