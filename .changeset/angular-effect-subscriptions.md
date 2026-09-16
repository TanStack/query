---
'@tanstack/angular-query': patch
---

Manage external-store subscriptions through Angular's lifecycle, keeping snapshot reads free of subscription side effects. Catch changes made during initialization and source replacement, preserve synchronous notifications once connected, and clean up on destruction. Public signatures are unchanged.
