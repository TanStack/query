---
'@tanstack/solid-query': minor
---

SSR lifecycle utilities: new `dehydrateSettled` awaits in-flight queries before dehydrating so streamed HTML carries settled data; `QueryClientProvider` tears the client down after server render disposal (`cancelQueries` + `clear`, preventing cross-request leaks) and dehydration now respects `defaultOptions.dehydrate.shouldDehydrateQuery` filtering.
