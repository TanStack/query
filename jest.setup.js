// eslint-disable-next-line @typescript-eslint/no-var-requires
const failOnConsole = require('jest-fail-on-console')
const { TextEncoder } = require('util')

failOnConsole()

// jsdom assumes the availability of a global TextEncoder, which jest-environment-jsdom does not provide
// eslint-disable-next-line no-undef
globalThis.TextEncoder = TextEncoder
