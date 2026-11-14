import { describe, expect, it } from 'vitest'
import Devtools from './fixtures/devtools-fixture.marko'

// The devtools inputs hold functions (`initializer`, `onClose`). Marko
// serializes tag input for the browser, so each function must be created
// inside an accessor, as `client` and `shadowDOMTarget` already are. A plain
// array in input fails the render with "Unable to serialize".
describe('devtools input serialization', () => {
  it('errorTypes and onClose built inside accessors serialize', async () => {
    const html = await Promise.resolve(
      Devtools.render({ name: 'QueryError', $global: {} as Marko.Global }),
    ).then(String)
    expect(html).toContain('tsqd-parent-container')
  })
})
