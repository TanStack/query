import { configs } from './index'
import { describe, it, expect } from 'vitest'

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
          },
        },
      }
    `)
  })
})
