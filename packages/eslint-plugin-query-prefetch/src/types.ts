/**
 * Extra fields in a rule's `meta.docs`: `recommended` is the rule's severity in the recommended
 * configs.
 */
export type ExtraRuleDocs = {
  /**
   * The rule's severity in the recommended configs.
   */
  recommended: 'error' | 'warn'
}
