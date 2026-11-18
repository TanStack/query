---
'@tanstack/query-devtools': patch
---

The devtools no longer use goober. Their styles are a static stylesheet adopted into the document or shadow root the devtools render in, instead of a `<style>` element in `<head>`. This means:

- The devtools are styled on pages with a Content Security Policy that blocks inline `<style>` elements, without a nonce. `styleNonce` is only needed in browsers without constructable stylesheets, such as Safari before 16.4.
- Devtools rendered inside a shadow root are styled without passing `shadowDOMTarget`.
- With `shadowDOMTarget`, the settings menu is styled.
- The picture-in-picture window gets all styles, including ones the devtools use only after it opened.
- The devtools no longer write to the shared `#_goober` style element or set `window.__nonce__`.
