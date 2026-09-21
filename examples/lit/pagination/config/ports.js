const DEFAULT_DEMO_PORT = 4183
const DEFAULT_API_PORT = 4184

function readPortFromEnv(name, fallback) {
  const rawValue = process.env[name]
  if (!rawValue) {
    return fallback
  }

  const parsed = Number.parseInt(rawValue, 10)
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 65_535

  if (!valid) {
    throw new Error(
      `Invalid ${name}="${rawValue}". Expected integer in [1, 65535].`,
    )
  }

  return parsed
}

export const DEMO_PORT = readPortFromEnv(
  'PAGINATION_DEMO_PORT',
  DEFAULT_DEMO_PORT,
)
export const API_PORT = readPortFromEnv('PAGINATION_API_PORT', DEFAULT_API_PORT)
