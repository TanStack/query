/* eslint-disable */
/* tslint:disable */

/**
 * Mock Service Worker (0.39.2).
 * @see https://github.com/mswjs/msw
 * - Please do NOT modify this file.
 * - Please do NOT serve this file on production.
 */

const INTEGRITY_CHECKSUM = '02f4ad4a2797f85668baf196e553d929'
const bypassHeaderName = 'x-msw-bypass'
const activeClientIds = new Set()

self.addEventListener('install', function () {
  return self.skipWaiting()
})

self.addEventListener('activate', async function (event) {
  return self.clients.claim()
})

self.addEventListener('message', async function (event) {
  const clientId = event.source.id

  if (!clientId || !self.clients) {
    return
  }

  const client = await self.clients.get(clientId)

  if (!client) {
    return
  }

  const allClients = await self.clients.matchAll()

  switch (event.data) {
    case 'KEEPALIVE_REQUEST': {
      sendToClient(client, {
        type: 'KEEPALIVE_RESPONSE',
      })
      break
    }

    case 'INTEGRITY_CHECK_REQUEST': {
      sendToClient(client, {
        type: 'INTEGRITY_CHECK_RESPONSE',
        payload: INTEGRITY_CHECKSUM,
      })
      break
    }

    case 'MOCK_ACTIVATE': {
      activeClientIds.add(clientId)

      sendToClient(client, {
        type: 'MOCKING_ENABLED',
        payload: true,
      })
      break
    }

    case 'MOCK_DEACTIVATE': {
      activeClientIds.delete(clientId)
      break
    }

    case 'CLIENT_CLOSED': {
      activeClientIds.delete(clientId)

      const remainingClients = allClients.filter((client) => {
        return client.id !== clientId
      })

      // Unregister itself when there are no more clients
      if (remainingClients.length === 0) {
        self.registration.unregister()
      }

      break
    }
  }
})

// Resolve the "main" client for the given event.
// Client that issues a request doesn't necessarily equal the client
// that registered the worker. It's with the latter the worker should
// communicate with during the response resolving phase.
async function resolveMainClient(event) {
  const client = await self.clients.get(event.clientId)

  if (client.frameType === 'top-level') {
    return client
  }

  const allClients = await self.clients.matchAll()

  return allClients
    .filter((client) => {
      // Get only those clients that are currently visible.
      return client.visibilityState === 'visible'
    })
    .find((client) => {
      // Find the client ID that's recorded in the
      // set of clients that have registered the worker.
      return activeClientIds.has(client.id)
    })
}

async function handleRequest(event, requestId) {
  const client = await resolveMainClient(event)
  const response = await getResponse(event, client, requestId)

  // Send back the response clone for the "response:*" life-cycle events.
  // Ensure MSW is active and ready to handle the message, otherwise
  // this message will pend indefinitely.
  if (client && activeClientIds.has(client.id)) {
    ;(async function () {
      const clonedResponse = response.clone()
      sendToClient(client, {
        type: 'RESPONSE',
        payload: {
          requestId,
          type: clonedResponse.type,
          ok: clonedResponse.ok,
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          body:
            clonedResponse.body === null ? null : await clonedResponse.text(),
          headers: serializeHeaders(clonedResponse.headers),
          redirected: clonedResponse.redirected,
        },
      })
    })()
  }

  return response
}

async function getResponse(event, client, requestId) {
  const { request } = event
  const requestClone = request.clone()
  const getOriginalResponse = () => fetch(requestClone)

  // Bypass mocking when the request client is not active.
  if (!client) {
    return getOriginalResponse()
  }

  // Bypass initial page load requests (i.e. static assets).
  // The absence of the immediate/parent client in the map of the active clients
  // means that MSW hasn't dispatched the "MOCK_ACTIVATE" event yet
  // and is not ready to handle requests.
  if (!activeClientIds.has(client.id)) {
    return await getOriginalResponse()
  }

  // Bypass requests with the explicit bypass header
  if (requestClone.headers.get(bypassHeaderName) === 'true') {
    const cleanRequestHeaders = serializeHeaders(requestClone.headers)

    // Remove the bypass header to comply with the CORS preflight check.
    delete cleanRequestHeaders[bypassHeaderName]

    const originalRequest = new Request(requestClone, {
      headers: new Headers(cleanRequestHeaders),
    })

    return fetch(originalRequest)
  }

  // Send the request to the client-side MSW.
  const reqHeaders = serializeHeaders(request.headers)
  const body = await request.text()

  const clientMessage = await sendToClient(client, {
    type: 'REQUEST',
    payload: {
      id: requestId,
      url: request.url,
      method: request.method,
      headers: reqHeaders,
      cache: request.cache,
      mode: request.mode,
      credentials: request.credentials,
      destination: request.destination,
      integrity: request.integrity,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      body,
      bodyUsed: request.bodyUsed,
      keepalive: request.keepalive,
    },
  })

  switch (clientMessage.type) {
    case 'MOCK_SUCCESS': {
      return delayPromise(
        () => respondWithMock(clientMessage),
        clientMessage.payload.delay,
      )
    }

    case 'MOCK_NOT_FOUND': {
      return getOriginalResponse()
    }

    case 'NETWORK_ERROR': {
      const { name, message } = clientMessage.payload
      const networkError = new Error(message)
      networkError.name = name

      // Rejecting a request Promise emulates a network error.
      throw networkError
    }

    case 'INTERNAL_ERROR': {
      const parsedBody = JSON.parse(clientMessage.payload.body)

      console.error(
        `\
[MSW] Uncaught exception in the request handler for "%s %s":

${parsedBody.location}

This exception has been gracefully handled as a 500 response, however, it's strongly recommended to resolve this error, as it indicates a mistake in your code. If you wish to mock an error response, please see this guide: https://mswjs.io/docs/recipes/mocking-error-responses\
`,
        request.method,
        request.url,
      )

      return respondWithMock(clientMessage)
    }
  }

  return getOriginalResponse()
}

self.addEventListener('fetch', function (event) {
  const { request } = event
  const accept = request.headers.get('accept') || ''

  // Bypass server-sent events.
  if (accept.includes('text/event-stream')) {
    return
  }

  // Bypass navigation requests.
  if (request.mode === 'navigate') {
    return
  }

  // Opening the DevTools triggers the "only-if-cached" request
  // that cannot be handled by the worker. Bypass such requests.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return
  }

  // Bypass all requests when there are no active clients.
  // Prevents the self-unregistered worked from handling requests
  // after it's been deleted (still remains active until the next reload).
  if (activeClientIds.size === 0) {
    return
  }

  const requestId = uuidv4()

  return event.respondWith(
    handleRequest(event, requestId).catch((error) => {
      if (error.name === 'NetworkError') {
        console.warn(
          '[MSW] Successfully emulated a network error for the "%s %s" request.',
          request.method,
          request.url,
        )
        return
      }

      // At this point, any exception indicates an issue with the original request/response.
      console.error(
        `\
[MSW] Caught an exception from the "%s %s" request (%s). This is probably not a problem with Mock Service Worker. There is likely an additional logging output above.`,
        request.method,
        request.url,
        `${error.name}: ${error.message}`,
      )
    }),
  )
})

function serializeHeaders(headers) {
  const reqHeaders = {}
  headers.forEach((value, name) => {
    reqHeaders[name] = reqHeaders[name]
      ? [].concat(reqHeaders[name]).concat(value)
      : value
  })
  return reqHeaders
}

function sendToClient(client, message) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = (event) => {
      if (event.data && event.data.error) {
        return reject(event.data.error)
      }

      resolve(event.data)
    }

    client.postMessage(JSON.stringify(message), [channel.port2])
  })
}

function delayPromise(cb, duration) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(cb()), duration)
  })
}

function respondWithMock(clientMessage) {
  return new Response(clientMessage.payload.body, {
    ...clientMessage.payload,
    headers: clientMessage.payload.headers,
  })
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
