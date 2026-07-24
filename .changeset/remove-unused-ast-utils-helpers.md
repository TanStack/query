---
"@tanstack/eslint-plugin-query": patch
---

Remove unused helper functions from the internal `ASTUtils` object (`getNestedIdentifiers`, `getNestedReturnStatements`, `getClosestVariableDeclarator`, `mapKeyNodeToText`, and `mapKeyNodeToBaseText`). They were not referenced by any rule and are not part of the public API.
