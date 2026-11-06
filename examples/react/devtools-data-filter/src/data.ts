// Deterministic fake data, so the same search terms work on every reload.

const WORDS = [
  'alpha',
  'bravo',
  'cobalt',
  'delta',
  'ember',
  'fjord',
  'granite',
  'harbor',
  'indigo',
  'juniper',
  'kelvin',
  'lumen',
  'meadow',
  'nebula',
  'onyx',
  'prairie',
  'quartz',
  'riverbank',
  'saffron',
  'tundra',
  'umber',
  'velvet',
  'willow',
  'xenon',
  'yarrow',
  'zephyr',
  'basalt',
  'cedar',
  'dune',
  'estuary',
  'fennel',
  'glacier',
  'hollow',
  'iris',
  'jasper',
  'kestrel',
  'lagoon',
  'mistral',
  'nimbus',
  'orchard',
  'pebble',
  'quill',
  'russet',
  'sierra',
  'thistle',
]

// Combined with the product id, these produce one unique codename per product
const ADJECTIVES = [
  'amber',
  'brisk',
  'crimson',
  'dapper',
  'eager',
  'feral',
  'gilded',
  'hushed',
  'icy',
  'jolly',
  'keen',
  'lucid',
  'mellow',
  'nimble',
  'opal',
  'plucky',
]
const ANIMALS = [
  'falcon',
  'badger',
  'otter',
  'lynx',
  'heron',
  'marmot',
  'ibex',
  'puffin',
  'gecko',
  'walrus',
  'tapir',
  'quokka',
  'narwhal',
  'osprey',
  'bison',
  'koala',
]

const FIRST_NAMES = [
  'Ada',
  'Bjorn',
  'Chiara',
  'Dmitri',
  'Elif',
  'Farah',
  'Gustav',
  'Hana',
  'Ines',
  'Jonas',
  'Keiko',
  'Lars',
  'Mira',
  'Nadia',
  'Oskar',
  'Priya',
]
const LAST_NAMES = [
  'Abernathy',
  'Bergstrom',
  'Castellanos',
  'Dubois',
  'Eriksen',
  'Fujimoto',
  'Gallagher',
  'Halvorsen',
  'Ivanova',
  'Jaramillo',
  'Kowalczyk',
  'Lindqvist',
]

function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Random = ReturnType<typeof createRandom>

const pick = <T>(random: Random, list: ReadonlyArray<T>): T =>
  list[Math.floor(random() * list.length)]

const int = (random: Random, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1))

const pad = (value: number, length = 4) => String(value).padStart(length, '0')

function sentence(random: Random, words: number) {
  const parts = Array.from({ length: words }, () => pick(random, WORDS))
  const text = parts.join(' ')
  return text.charAt(0).toUpperCase() + text.slice(1) + '.'
}

function paragraph(random: Random, sentences: number) {
  return Array.from({ length: sentences }, () =>
    sentence(random, int(random, 8, 18)),
  ).join(' ')
}

/** The unique, human readable search term for a product. */
export function productCodename(id: number) {
  return `${ADJECTIVES[id % ADJECTIVES.length]}-${
    ANIMALS[Math.floor(id / ADJECTIVES.length) % ANIMALS.length]
  }-${pad(id)}`
}

export const productSku = (id: number) => `SKU-${pad(id, 5)}-X`
export const userEmail = (id: number) => `customer.${pad(id)}@example.test`
export const orderTrackingNumber = (id: number) => `TRK-${pad(id * 7919, 8)}-EU`

export type ProductSummary = { id: number; name: string }

export function productSummaries(count: number): Array<ProductSummary> {
  // Names only: none of the unique detail values are duplicated in the list query
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Product #${index + 1}`,
  }))
}

function nestedSpecs(random: Random, depth: number, breadth: number): unknown {
  if (depth === 0) {
    return {
      value: random() * 1000,
      unit: pick(random, ['mm', 'kg', 'W', 'Hz', 'lm', 'dB']),
      note: sentence(random, int(random, 6, 14)),
      verified: random() > 0.5,
    }
  }
  return Object.fromEntries(
    Array.from({ length: breadth }, (_, index) => [
      `${pick(random, WORDS)}_${depth}_${index}`,
      nestedSpecs(random, depth - 1, breadth),
    ]),
  )
}

export function productDetail(id: number) {
  const random = createRandom(id * 9973)
  const codename = productCodename(id)

  return {
    id,
    sku: productSku(id),
    name: `Product #${id}`,
    slug: `product-${id}`,
    description: Array.from({ length: 6 }, () => paragraph(random, 8)).join(
      '\n\n',
    ),
    price: { amount: int(random, 500, 99999) / 100, currency: 'EUR' },
    // 150 flat props
    attributes: Object.fromEntries(
      Array.from({ length: 150 }, (_, index) => [
        `attribute_${pad(index, 3)}`,
        index % 3 === 0
          ? sentence(random, int(random, 4, 12))
          : index % 3 === 1
            ? random() * 10000
            : random() > 0.5,
      ]),
    ),
    // 3^5 = 243 leaves, 5 levels deep
    specs: nestedSpecs(random, 5, 3),
    variants: Array.from({ length: 30 }, (_, index) => ({
      id: `${id}-variant-${index}`,
      color: pick(random, WORDS),
      size: pick(random, ['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      pricing: {
        list: int(random, 500, 99999) / 100,
        sale: int(random, 500, 99999) / 100,
        history: Array.from({ length: 8 }, (__, step) => ({
          date: new Date(Date.UTC(2025, step, 1)).toISOString(),
          amount: int(random, 500, 99999) / 100,
        })),
      },
      inventory: {
        warehouses: Array.from({ length: 4 }, (__, warehouse) => ({
          code: `WH-${warehouse}`,
          stock: int(random, 0, 500),
          aisle: pick(random, WORDS),
        })),
      },
    })),
    reviews: Array.from({ length: 40 }, (_, index) => ({
      id: `${id}-review-${index}`,
      rating: int(random, 1, 5),
      title: sentence(random, int(random, 3, 8)),
      body: paragraph(random, int(random, 3, 7)),
      author: {
        name: `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`,
        location: { city: pick(random, WORDS), country: 'Nowhere' },
      },
    })),
    // Deep inside the payload, so a match requires walking most of the tree
    logistics: {
      warehouse: {
        location: {
          building: { floor: { shelf: { bin: { label: `BIN ${codename}` } } } },
        },
      },
    },
  }
}

export type ProductDetail = ReturnType<typeof productDetail>

export function userDetail(id: number) {
  const random = createRandom(id * 7877)
  return {
    id,
    email: userEmail(id),
    name: `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`,
    bio: paragraph(random, 12),
    preferences: Object.fromEntries(
      Array.from({ length: 80 }, (_, index) => [
        `preference_${pad(index, 3)}`,
        index % 2 === 0 ? pick(random, WORDS) : random() > 0.5,
      ]),
    ),
    addresses: Array.from({ length: 5 }, (_, index) => ({
      label: `address-${index}`,
      street: `${int(random, 1, 999)} ${pick(random, WORDS)} street`,
      city: pick(random, WORDS),
      geo: { lat: random() * 180 - 90, lng: random() * 360 - 180 },
    })),
    activity: Array.from({ length: 60 }, (_, index) => ({
      at: new Date(Date.UTC(2025, 0, 1 + index)).toISOString(),
      action: pick(random, ['viewed', 'purchased', 'reviewed', 'returned']),
      productId: int(random, 1, 1000),
      context: {
        device: pick(random, ['ios', 'android', 'web']),
        note: sentence(random, 10),
      },
    })),
  }
}

export function orderDetail(id: number) {
  const random = createRandom(id * 6151)
  return {
    id,
    trackingNumber: orderTrackingNumber(id),
    customerId: int(random, 1, 1000),
    notes: paragraph(random, 10),
    lines: Array.from({ length: 25 }, (_, index) => ({
      line: index + 1,
      productId: int(random, 1, 1000),
      quantity: int(random, 1, 5),
      price: int(random, 500, 99999) / 100,
      fulfillment: {
        status: pick(random, ['pending', 'picked', 'packed', 'shipped']),
        events: Array.from({ length: 6 }, (__, step) => ({
          at: new Date(Date.UTC(2025, 5, 1 + step)).toISOString(),
          message: sentence(random, int(random, 6, 12)),
        })),
      },
    })),
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchProducts(count: number) {
  await wait(100)
  return productSummaries(count)
}

export async function fetchProduct(id: number) {
  await wait(50 + (id % 10) * 10)
  return productDetail(id)
}

export async function fetchUser(id: number) {
  await wait(50)
  return userDetail(id)
}

export async function fetchOrder(id: number) {
  await wait(50)
  return orderDetail(id)
}
