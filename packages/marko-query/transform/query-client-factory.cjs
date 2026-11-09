'use strict'

// Compile-time half of `<query-client-factory factory=createClient/>`.
//
// A route handler or middleware that prefetches runs before the layout
// renders, and the client it gets must already be made by the factory. The
// browser has the same requirement: the first `<query>` creates the page's
// client from its mount hook, and Marko mounts children before parents, so a
// hook in the layout runs too late. Both realms therefore register the factory
// when the template's module is evaluated, which precedes any handler,
// middleware, render or mount. Loading a route loads the layout with it, so
// the server registration also precedes the first request's handler.

const TAG = '<query-client-factory>'

module.exports = function transform(tag, t) {
  const file = tag.hub.file

  const attr = tag
    .get('attributes')
    .find((a) => a.isMarkoAttribute() && a.node.name === 'factory')
  if (!attr || !attr.node.value) {
    throw tag
      .get('name')
      .buildCodeFrameError(`${TAG} needs a \`factory\` attribute.`)
  }
  const value = attr.node.value
  if (
    !t.isIdentifier(value) ||
    !isImported(file.path.node.body, value.name, t)
  ) {
    throw attr.buildCodeFrameError(
      `${TAG} \`factory\` must be a function imported by this template ` +
        '(`factory=createQueryClient`), not an inline expression. It is ' +
        'registered when the template loads, before any route handler runs.',
    )
  }
  if (file.metadata.queryClientFactoryTag) {
    throw tag
      .get('name')
      .buildCodeFrameError(
        `${TAG} can only be used once per template. Use it once, in the root layout.`,
      )
  }
  file.metadata.queryClientFactoryTag = true

  file.path.pushContainer(
    'body',
    t.markoScriptlet(
      [
        t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier('setQueryClientFactory'),
              t.identifier('setQueryClientFactory'),
            ),
          ],
          t.stringLiteral('@tanstack/marko-query'),
        ),
        t.expressionStatement(
          t.callExpression(t.identifier('setQueryClientFactory'), [
            t.identifier(value.name),
          ]),
        ),
      ],
      true,
      null,
    ),
  )

  // The tag's input carries the factory to the browser as well, so the tag
  // keeps working when a host renders it without this transform.
  attr.node.value = t.arrowFunctionExpression(
    [],
    t.callExpression(t.identifier(value.name), []),
  )
}

function isImported(body, name, t) {
  return body.some(
    (node) =>
      t.isImportDeclaration(node) &&
      node.specifiers.some((s) => s.local.name === name),
  )
}
