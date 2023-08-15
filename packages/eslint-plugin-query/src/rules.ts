import * as exhaustiveDeps from './rules/exhaustive-deps.rule'

export const rules = {
  [exhaustiveDeps.name]: exhaustiveDeps.rule,
}
