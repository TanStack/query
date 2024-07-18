import { MarkdownRendererEvent } from 'typedoc-plugin-markdown'

/**
 * @param {import("typedoc-plugin-markdown").MarkdownApplication} app
 */
export function load(app) {
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
        const newBasename = name.join('.').toLowerCase()
        urlMapping.url = newBasename
        urlMapping.model.url = newBasename
        return urlMapping
      })
    },
  )
}
