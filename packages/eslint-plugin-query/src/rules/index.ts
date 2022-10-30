import * as exaustiveDeps from './exhaustive-deps/exhaustive-deps.rule'
import * as preferObjectSyntax from './prefer-query-object-syntax/prefer-query-object-syntax'

export const rules = {
  [exaustiveDeps.name]: exaustiveDeps.rule,
  [preferObjectSyntax.name]: preferObjectSyntax.rule,
}
