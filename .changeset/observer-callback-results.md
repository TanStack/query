---
'@tanstack/query-core': patch
---

Report placeholder factory and selector failures as observer errors. Keep those errors stable across repeated snapshot reads and drop selected data when a reset removes its source.
