export function lazyInit<T extends object>(initializer: () => T): T {
  let object: T | null = null

  const initializeObject = () => {
    if (!object) {
      object = initializer()
    }
  }

  Promise.resolve().then(() => {
    initializeObject()
  })

  return new Proxy<T>({} as T, {
    get(_, prop, receiver) {
      initializeObject()
      return Reflect.get(object as T, prop, receiver)
    },
    has(_, prop) {
      initializeObject()
      return Reflect.has(object as T, prop)
    },
    ownKeys() {
      initializeObject()
      return Reflect.ownKeys(object as T)
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true,
      }
    },
  })
}
