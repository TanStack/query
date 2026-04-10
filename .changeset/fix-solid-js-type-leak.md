---
"@tanstack/query-devtools": patch
---

Fix solid-js types leaking into bundled .d.ts file

Remove `experimentalDts: true` and `delete tsup_option.dts` from tsup.config.ts to prevent solid-js internal types from being exposed to React projects. Reverts to rollup-plugin-dts which correctly treats solid-js as external.

Fixes #10421
