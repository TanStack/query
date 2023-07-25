type InjectIntoStreamOpts = {
  emitToDocumentHead?: () => string
  emitBeforeSsrChunk: () => Promise<string>
}

const encoder = /* #__PURE__ */ new TextEncoder()
const decoder = /* #__PURE__ */ new TextDecoder()

export function injectIntoStream({
  emitToDocumentHead,
  emitBeforeSsrChunk,
}: InjectIntoStreamOpts) {
  // regex pattern for matching closing body and html tags
  const patternHead = /(<\/head>)/
  const patternBody = /(<\/body>)/

  let leftover = ''
  let headMatched = false

  return new TransformStream({
    async transform(chunk, controller) {
      const chunkString = leftover + decoder.decode(chunk)

      let processed = chunkString

      if (emitToDocumentHead && !headMatched) {
        const strToInject = emitToDocumentHead().trim()
        if (strToInject) {
          const headMatch = processed.match(patternHead)
          if (headMatch) {
            const headIndex = headMatch.index!
            headMatched = true
            const headChunk =
              processed.slice(0, headIndex) +
              emitToDocumentHead() +
              processed.slice(headIndex, headMatch[0].length)
            controller.enqueue(encoder.encode(headChunk))
            processed = processed.slice(headIndex + headMatch[0].length)
          }
        }
      }

      const bodyMatch = processed.match(patternBody)
      if (bodyMatch) {
        // If a </body> sequence was found
        const bodyIndex = bodyMatch.index!

        const html = await emitBeforeSsrChunk()
        // console.log('BODY MATCH', html);

        // Add the arbitrary HTML before the closing body tag
        processed =
          processed.slice(0, bodyIndex) + html + processed.slice(bodyIndex)

        controller.enqueue(encoder.encode(processed))
        leftover = ''
      } else {
        const html = await emitBeforeSsrChunk()
        // console.log('ARBITRARY MATCH', html, processed);

        if (html) {
          processed = html + processed
        }

        controller.enqueue(encoder.encode(processed))
      }
    },
    flush(controller) {
      if (leftover) {
        // console.log('flush', leftover);
        controller.enqueue(encoder.encode(leftover))
      }
    },
  })
}
