---
'@tanstack/angular-query': patch
---

Fix the `migrate-from-experimental` schematic aborting with `Path "…" is a file.` when a project source imports a package subpath that names a file, such as `@noble/hashes/sha3.js`.
