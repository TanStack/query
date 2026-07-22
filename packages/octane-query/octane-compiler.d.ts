declare module 'octane/compiler' {
  export interface SourceMap {
    version: number
    sources: Array<string>
    sourcesContent?: Array<string>
    names: Array<string>
    mappings: string
    file?: string
    sourceRoot?: string
  }

  export interface CompileResult {
    code: string
    map?: SourceMap | null
  }

  export function compile(
    source: string,
    filename: string,
    options?: { mode?: 'client' | 'server' },
  ): CompileResult
}
