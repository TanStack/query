/**
 * Extra fields in a rule's `meta.docs`: `recommended` is the rule's severity in the recommended
 * configs, or `'strict'` if it is only enabled in the strict ones.
 */
export type ExtraRuleDocs = {
  recommended: 'strict' | 'error' | 'warn'
}
