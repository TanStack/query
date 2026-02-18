---
id: caching
title: Caching Examples
ref: docs/framework/react/guides/caching.md
replace:
  {
    'useQuery[(][{] queryKey': "useQuery(() => ({ queryKey",
    'fetchTodos [}][)]': "fetchTodos }))",
  }
---

[//]: # 'StaleNote'
  - The data will be marked as stale after the configured `staleTime` (defaults to `0`, or immediately).
[//]: # 'StaleNote'
