import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll } from 'vitest'

const roots: Array<string> = []

afterAll(() => {
  for (const root of roots) {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

/**
 * Removes the indentation shared by the lines of a template, so code can be indented with the test.
 * Unlike `normalizeIndent`, it supports interpolated values.
 */
export function code(
  strings: TemplateStringsArray,
  ...values: Array<unknown>
): string {
  const text = strings.reduce(
    (result, string, index) =>
      result + string + (index < values.length ? String(values[index]) : ''),
    '',
  )
  return dedent(text)
}

function dedent(text: string): string {
  const lines = text
    .replace(/^\n/, '')
    .replace(/\n\s*$/, '')
    .split('\n')
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim() !== '')
      .map((line) => line.match(/^\s*/)![0].length),
  )
  return lines.map((line) => line.slice(indent)).join('\n') + '\n'
}

/**
 * Writes the files of a project to a temporary directory, so the rule can follow imports between
 * them.
 * @returns A function that returns the absolute path of a file of the project.
 */
export function createProject(
  files: Record<string, string>,
): (file: string) => string {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'require-prefetch-')),
  )
  roots.push(root)
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(root, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, file.endsWith('.json') ? content : dedent(content))
  }
  return (file) => path.join(root, file)
}
