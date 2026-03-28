const FALLBACK_LOCALE = 'en-US'

export function resolveDateTimeLocale(
  preferredLocales: ReadonlyArray<unknown>,
): string {
  for (const preferredLocale of preferredLocales) {
    if (typeof preferredLocale !== 'string' || preferredLocale.trim() === '') {
      continue
    }

    try {
      return Intl.getCanonicalLocales(preferredLocale)[0]!
    } catch {
      continue
    }
  }

  return FALLBACK_LOCALE
}

export function getNavigatorLocales(
  navigatorLike:
    | Pick<Navigator, 'language' | 'languages'>
    | undefined = globalThis.navigator,
): Array<unknown> {
  const navigatorLanguages = Array.isArray(navigatorLike?.languages)
    ? navigatorLike.languages
    : []

  return [...navigatorLanguages, navigatorLike?.language]
}

export function formatDateTime(
  value: string | number | Date,
  preferredLocales: ReadonlyArray<unknown> = getNavigatorLocales(),
): string {
  const date = value instanceof Date ? value : new Date(value)

  return date.toLocaleString(resolveDateTimeLocale(preferredLocales))
}
