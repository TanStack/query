---
'@tanstack/solid-query': patch
---

Recreate useQueries observers when a reactive custom QueryClient accessor switches so subsequent queries use the new client's cache and defaults.
