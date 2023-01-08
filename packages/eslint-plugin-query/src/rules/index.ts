import * as exhaustiveDeps from './exhaustive-deps/exhaustive-deps.rule'

export const rules = {
  [exhaustiveDeps.name]: exhaustiveDeps.rule,
}
