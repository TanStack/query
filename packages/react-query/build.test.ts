import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const esmExtensions = ['.js', '.js.map', '.d.ts', '.d.ts.map']

describe('Build React', () => {
  it('should match the output snapshot', () => {
    const file = 'esm/index'
    esmExtensions.forEach((ext) => {
      expect(readFileSync(`dist/${file}${ext}`).toString()).toMatchFileSnapshot(
        `snap/${file}${ext}`,
      )
    })
  })
})
