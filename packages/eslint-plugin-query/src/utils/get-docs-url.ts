/**
 * Builds the URL of a rule's documentation page.
 * @param ruleName - The rule's name, e.g. `exhaustive-deps`.
 * @returns The URL of the rule's page in the ESLint plugin docs.
 */
export const getDocsUrl = (ruleName: string): string =>
  `https://tanstack.com/query/latest/docs/eslint/${ruleName}`
