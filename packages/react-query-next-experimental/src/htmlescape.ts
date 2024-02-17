// --------------------------------------------------------------------------------
//
// copied from
// https://github.com/vercel/next.js/blob/6bc07792a4462a4bf921a72ab30dc4ab2c4e1bda/packages/next/src/server/htmlescape.ts
// License: https://github.com/vercel/next.js/blob/6bc07792a4462a4bf921a72ab30dc4ab2c4e1bda/packages/next/license.md
//
// --------------------------------------------------------------------------------

// This utility is based on https://github.com/zertosh/htmlescape
// License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE

const ESCAPE_LOOKUP: Record<string, string> = {
  '&': '\\u0026',
  '>': '\\u003e',
  '<': '\\u003c',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

export const ESCAPE_REGEX = /[&><\u2028\u2029]/g

export function htmlEscapeJsonString(str: string): string {
  return str.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]!)
}
