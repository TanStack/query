---
id: installation
title: Installation
---

Install the official adapter and Octane:

```bash
pnpm add @tanstack/octane-query octane
```

Or use the equivalent command for npm, Yarn, or Bun.

`octane` is a peer dependency. `@tanstack/query-core` is included by the
adapter and all of its public APIs are re-exported from
`@tanstack/octane-query`.

## Compiler requirement

The adapter publishes TSRX source so Octane can compile the correct client and
server output. Use Octane's standard Vite integration in the consuming app.
The package is not a precompiled Node.js runtime entry point.

The adapter requires Node.js 22 or newer for its package tooling.
