import fs from 'node:fs'
import path from 'node:path'

/** The extensions of route and layout modules, in the order they are looked for. */
export const moduleExtensions = ['.tsx', '.ts', '.jsx', '.js']

/**
 * Finds the outermost directory with a name that a file is in, since routes can have folders with
 * the same name.
 * @param file - The file's absolute path.
 * @param name - The directory's name, like `app`.
 * @returns The directory, or `null` if the file isn't in one with that name.
 */
export function findOutermostDir(file: string, name: string): string | null {
  const parts = path.dirname(file).split(path.sep)
  const index = parts.indexOf(name)
  return index === -1 ? null : parts.slice(0, index + 1).join(path.sep)
}

/**
 * Lists a directory and the directories above it, up to a root directory, outermost first.
 * @param root - The outermost directory to list.
 * @param dir - The innermost directory, inside `root`.
 * @returns The directories, from `root` to `dir`.
 */
export function getDirsFrom(root: string, dir: string): Array<string> {
  const dirs: Array<string> = []
  for (let current = dir; ; current = path.dirname(current)) {
    dirs.unshift(current)
    if (current === root || path.dirname(current) === current) {
      return dirs
    }
  }
}

/**
 * Finds the file of a module path without its extension.
 * @param base - The absolute path without an extension.
 * @param extensions - The extensions to try, in order.
 * @returns The first file that exists, or `null` if none do.
 */
export function findWithExtension(
  base: string,
  extensions: ReadonlyArray<string>,
): string | null {
  return (
    extensions
      .map((extension) => base + extension)
      .find((file) => fs.existsSync(file)) ?? null
  )
}
