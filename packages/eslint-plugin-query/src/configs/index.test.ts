import { configs } from './index'

describe('configs', () => {
  it('should match snapshot', () => {
    expect(configs).toMatchInlineSnapshot(`
      {
        "recommended": {
          "plugins": [
            "@tanstack/eslint-plugin-query",
          ],
          "rules": {
            "@tanstack/query/exhaustive-deps": "error",
            "@tanstack/query/no-callbacks": "error",
            "@tanstack/query/prefer-query-object-syntax": "error",
            "@tanstack/query/stable-query-client": "error",
          },
        },
      }
    `)
  })
})
