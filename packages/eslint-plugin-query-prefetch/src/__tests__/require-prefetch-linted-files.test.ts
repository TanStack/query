import { Linter } from 'eslint'
import * as tsParser from '@typescript-eslint/parser'
import { beforeEach, describe, expect, it } from 'vitest'
import { rule } from '../rules/require-prefetch/require-prefetch.rule'
import { code, createProject } from './project-fixture'

// `RuleTester` gives each test its own parser, so the files the rule caches across lints are
// tested with a `Linter` that lints several files with the same parser, as ESLint does.

const parsed: Array<string> = []
const parser = {
  ...tsParser,
  parseForESLint: (
    text: string,
    options: Parameters<typeof tsParser.parseForESLint>[1],
  ) => {
    parsed.push(String(options?.filePath))
    return tsParser.parseForESLint(text, options)
  },
}

const postComponent = code`
  import { useSuspenseQuery } from '@tanstack/react-query'
  import { postQueryOptions } from '../queries'

  export function Post({ postId }: { postId: string }) {
    useSuspenseQuery(postQueryOptions(postId))
    return null
  }
`

const route = code`
  import { createFileRoute } from '@tanstack/react-router'
  import { Post } from '../components/post'

  export const Route = createFileRoute('/posts/$postId')({
    component: Page,
  })

  function Page() {
    const { postId } = Route.useParams()
    return <Post postId={postId} />
  }
`

function createLinter() {
  const file = createProject({
    'src/queries.ts': code`
      import { queryOptions } from '@tanstack/react-query'

      export const postQueryOptions = (postId: string) =>
        queryOptions({ queryKey: ['post', postId], queryFn: () => fetchPost(postId) })
    `,
    'src/components/post.tsx': postComponent,
  })
  const linter = new Linter({ configType: 'flat', cwd: file('') })
  const config: Array<Linter.Config> = [
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: {
        'query-prefetch': {
          rules: { 'require-prefetch': rule as never },
        },
      },
      rules: { 'query-prefetch/require-prefetch': 'error' },
    },
  ]
  return {
    file,
    lint: (filename: string, text: string) =>
      linter.verify(text, config, { filename: file(filename) }),
  }
}

describe('require-prefetch with files linted before the files that import them', () => {
  beforeEach(() => {
    parsed.length = 0
  })

  it('reuses the AST ESLint parsed instead of parsing the file again', () => {
    const { file, lint } = createLinter()
    expect(lint('src/components/post.tsx', postComponent)).toStrictEqual([])

    const messages = lint('src/routes/posts.$postId.tsx', route)

    expect(messages.map((message) => message.messageId)).toStrictEqual([
      'missingPrefetch',
    ])
    expect(messages[0]?.message).toContain("in '../components/post.tsx'")
    expect(
      parsed.filter((filePath) => filePath === file('src/components/post.tsx')),
    ).toHaveLength(1)
  })

  it('reads the file on disk when ESLint linted different text', () => {
    const { lint } = createLinter()
    // An editor lints unsaved changes, which the files that import it don't see yet.
    expect(
      lint(
        'src/components/post.tsx',
        code`
          export function Post() {
            return null
          }
        `,
      ),
    ).toStrictEqual([])

    const messages = lint('src/routes/posts.$postId.tsx', route)

    expect(messages.map((message) => message.messageId)).toStrictEqual([
      'missingPrefetch',
    ])
  })
})
