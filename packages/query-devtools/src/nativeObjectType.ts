type NativeObjectType = 'Map' | 'Set' | 'String'

/**
 * Checks an object's internal slots with an intrinsic operation.
 * @param value - The inspected object.
 * @param type - The native brand to check.
 * @returns Whether the intrinsic operation accepts the object.
 */
function hasNativeBrand(value: object, type: NativeObjectType): boolean {
  try {
    switch (type) {
      case 'Map':
        Map.prototype.has.call(value, undefined)
        return true
      case 'Set':
        Set.prototype.has.call(value, undefined)
        return true
      case 'String':
        String.prototype.valueOf.call(value)
        return true
    }
  } catch {
    return false
  }
}

/**
 * Identifies native collections and String wrappers across realms without reading accessors.
 * @param value - The inspected value.
 * @returns Its native brand, or undefined for other values and failed inspections.
 */
export function getNativeObjectType(
  value: unknown,
): NativeObjectType | undefined {
  if (value === null || typeof value !== 'object') return undefined
  try {
    if (Array.isArray(value) || ArrayBuffer.isView(value)) return undefined
    const length = Object.getOwnPropertyDescriptor(value, 'length')
    if (
      typeof length?.value === 'number' &&
      !length.enumerable &&
      !length.writable &&
      !length.configurable &&
      hasNativeBrand(value, 'String')
    ) {
      return 'String'
    }
    const parent = Object.getPrototypeOf(value)
    if (parent === null) {
      if (hasNativeBrand(value, 'Map')) return 'Map'
      if (hasNativeBrand(value, 'Set')) return 'Set'
      return undefined
    }
    if (parent === Object.prototype) return undefined
    let prototype: object | null = value
    for (let depth = 0; prototype && depth <= 500; depth++) {
      const tag = Object.getOwnPropertyDescriptor(
        prototype,
        Symbol.toStringTag,
      )?.value
      if ((tag === 'Map' || tag === 'Set') && hasNativeBrand(value, tag)) {
        return tag
      }
      prototype = Object.getPrototypeOf(prototype)
    }
    return undefined
  } catch {
    return undefined
  }
}
