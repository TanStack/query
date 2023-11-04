import { describe, expect, it } from 'vitest'
import { configs } from '../configs'

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
            "@tanstack/query/no-rest-destructuring": "warn",
            "@tanstack/query/stable-query-client": "error",
          },
        },
      }
    `)
  })
})
