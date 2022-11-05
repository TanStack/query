/**

MIT License

Copyright (c) 2019 Mario Beltrán Alarcón

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import { resolve } from 'path'

import { TSESLint } from '@typescript-eslint/utils'

const DEFAULT_TEST_CASE_CONFIG = {
  filename: 'MyComponent.test.js',
}

class TestingLibraryRuleTester extends TSESLint.RuleTester {
  run<TMessageIds extends string, TOptions extends Readonly<unknown[]>>(
    ruleName: string,
    rule: TSESLint.RuleModule<TMessageIds, TOptions>,
    tests: TSESLint.RunTests<TMessageIds, TOptions>,
  ): void {
    const { valid, invalid } = tests

    const finalValid = valid.map((testCase) => {
      if (typeof testCase === 'string') {
        return {
          ...DEFAULT_TEST_CASE_CONFIG,
          code: testCase,
        }
      }

      return { ...DEFAULT_TEST_CASE_CONFIG, ...testCase }
    })
    const finalInvalid = invalid.map((testCase) => ({
      ...DEFAULT_TEST_CASE_CONFIG,
      ...testCase,
    }))

    super.run(ruleName, rule, { valid: finalValid, invalid: finalInvalid })
  }
}

export const createRuleTester = (
  parserOptions: Partial<TSESLint.ParserOptions> = {},
): TSESLint.RuleTester => {
  return new TestingLibraryRuleTester({
    parser: resolve('./node_modules/@typescript-eslint/parser'),
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
      ...parserOptions,
    },
  })
}

export function normalizeIndent(template: TemplateStringsArray) {
  const codeLines = template[0]?.split('\n') ?? ['']
  const leftPadding = codeLines[1]?.match(/\s+/)?.[0] ?? ''
  return codeLines.map((line) => line.slice(leftPadding.length)).join('\n')
}
