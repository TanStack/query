---
"@tanstack/query-core": patch
---

fix(thenable): use Object.create() to avoid Promise mutation in headless Chromium

Resolves issue where useQuery stays pending indefinitely in Puppeteer/Playwright. Headless Chromium enforces stricter Promise semantics, treating internal slots as sealed. The fix wraps the Promise with Object.create() instead of mutating it directly, preserving all Promise behavior while allowing custom properties.
