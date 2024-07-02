import { describe, expect, it } from 'vitest'
import { recommended } from '../configs/recommended'

describe('recommended', () => {
  it('should match snapshot', () => {
    expect(recommended).toMatchInlineSnapshot(`
      {
        "plugins": [
          "@tanstack/eslint-plugin-query",
        ],
        "rules": {
          "@tanstack/query/exhaustive-deps": "error",
          "@tanstack/query/no-rest-destructuring": "warn",
          "@tanstack/query/stable-query-client": "error",
        },
      }
    `)
  })
})
