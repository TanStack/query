---
'@tanstack/react-query': patch
---

Scope query error reset tracking per query hash so sibling queries do not consume an error boundary reset before an errored query remounts.
