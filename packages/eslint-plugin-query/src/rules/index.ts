import * as exhaustiveDeps from './exhaustive-deps/exhaustive-deps.rule'
import * as preferObjectSyntax from './prefer-query-object-syntax/prefer-query-object-syntax'

export const rules = {
  [exhaustiveDeps.name]: exhaustiveDeps.rule,
  [preferObjectSyntax.name]: preferObjectSyntax.rule,
}
