import {
  MarkdownPageEvent,
  MarkdownRendererEvent,
} from 'typedoc-plugin-markdown'

/**
 * @param {import("typedoc-plugin-markdown").MarkdownApplication} app
 */
export function load(app) {
  // Add `id` and `title` to frontmatter
  app.renderer.on(
    MarkdownPageEvent.BEGIN,
    /** @param {import('typedoc-plugin-markdown').MarkdownPageEvent} page */
    (page) => {
      page.frontmatter = {
        id: page.model.name,
        title: page.model.name,
      }
    },
  )
  // Rename output files
  app.renderer.on(
    MarkdownRendererEvent.BEGIN,
    /**
     * @param {import("typedoc-plugin-markdown").MarkdownRendererEvent} renderer
     */ (renderer) => {
      renderer.urls = renderer.urls?.map((urlMapping) => {
        const name = urlMapping.url.split('.')
        if (name[0] !== 'index') {
          name.splice(0, 1)
        }
        const newBasename = name.join('.')
        urlMapping.url = newBasename
        urlMapping.model.url = newBasename
        return urlMapping
      })
    },
  )
}
