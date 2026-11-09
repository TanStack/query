# Example

The same adapter on plain Vite with a hand-written Node server, without Marko
Run. It shows the whole integration surface a custom server needs: one `$global`
per request, prefetch with `getQueryClient`, then render.

To run this example from the repo root:

- `pnpm --dir examples/marko/custom-server run dev`
