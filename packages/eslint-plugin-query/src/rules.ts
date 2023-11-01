import * as exhaustiveDeps from './rules/exhaustive-deps.rule'
import * as stableQueryClient from './rules/stable-query-client/stable-query-client.rule'

export const rules = {
  [exhaustiveDeps.name]: exhaustiveDeps.rule,
  [stableQueryClient.name]: stableQueryClient.rule,
}
