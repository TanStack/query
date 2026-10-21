---
'@tanstack/react-query': patch
---

Update the observer options before subscribing so revealing an `<Activity>` tree whose query key changed while hidden no longer fetches the previous key.
