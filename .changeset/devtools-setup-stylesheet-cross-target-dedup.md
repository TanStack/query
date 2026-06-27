---
'@tanstack/query-devtools': patch
---

fix(query-devtools/utils): scope the 'setupStyleSheet' dedup check to the target so a 'shadowDOMTarget' still receives its own '#_goober' style tag when 'document.head' already has one
