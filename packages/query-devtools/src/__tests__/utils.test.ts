import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { QueryClient, QueryObserver } from '@tanstack/query-core'
import {
  convertRemToPixels,
  deleteNestedDataByPath,
  displayValue,
  getMutationStatusColor,
  getQueryStatusColorByLabel,
  getSidedProp,
  mutationSortFns,
  setupStyleSheet,
  sortFns,
  updateNestedDataByPath,
} from '../utils'
import type { Mutation, MutationStatus, Query } from '@tanstack/query-core'

describe('Utils tests', () => {
  describe('updatedNestedDataByPath', () => {
    describe('array', () => {
      it('should update data correctly', () => {
        const oldData = ['one', 'two', 'three']

        const newData = updateNestedDataByPath(oldData, ['1'], 'new')

        expect(newData).not.toBe(oldData) // should not be the same reference

        expect(oldData).toMatchInlineSnapshot(`
          [
            "one",
            "two",
            "three",
          ]
        `)
        expect(newData).toMatchInlineSnapshot(`
          [
            "one",
            "new",
            "three",
          ]
        `)
      })
    })

    describe('object', () => {
      it('should update data correctly', () => {
        const oldData = { title: 'Hello world', id: 1, createdAt: '2021-01-01' }

        const newData = updateNestedDataByPath(
          oldData,
          ['title'],
          'Brave new world',
        )

        expect(newData).not.toBe(oldData) // should not be the same reference

        expect(oldData).toMatchInlineSnapshot(`
          {
            "createdAt": "2021-01-01",
            "id": 1,
            "title": "Hello world",
          }
        `)
        expect(newData).toMatchInlineSnapshot(`
          {
            "createdAt": "2021-01-01",
            "id": 1,
            "title": "Brave new world",
          }
        `)
      })
    })

    describe('set', () => {
      it('should update data correctly', () => {
        const oldData = new Set([123, 321, 'hello', 'world'])

        const newData = updateNestedDataByPath(oldData, ['2'], 'hi')

        expect(newData).not.toBe(oldData) // should not be the same reference

        expect(oldData).toMatchInlineSnapshot(`
          Set {
            123,
            321,
            "hello",
            "world",
          }
        `)
        expect(newData).toMatchInlineSnapshot(`
          Set {
            123,
            321,
            "hi",
            "world",
          }
        `)
      })
    })

    describe('map', () => {
      it('should update data correctly', () => {
        const oldData = new Map([
          ['en', 'hello'],
          ['fr', 'bonjour'],
        ])

        /* eslint-disable cspell/spellchecker */
        const newData = updateNestedDataByPath(oldData, ['fr'], 'salut')

        expect(newData).not.toBe(oldData) // should not be the same reference

        expect(oldData).toMatchInlineSnapshot(`
          Map {
            "en" => "hello",
            "fr" => "bonjour",
          }
        `)
        expect(newData).toMatchInlineSnapshot(`
          Map {
            "en" => "hello",
            "fr" => "salut",
          }
        `)
      })
      /* eslint-enable */
    })

    describe('nested data', () => {
      it('should update data correctly', () => {
        /* eslint-disable cspell/spellchecker */
        const oldData = new Map([
          [
            'pumpkin-pie',
            {
              id: 1,
              title: 'Pumpkin pie',
              ingredients: new Set(['pumpkin', 'sugar', 'spices']),
              steps: ['mix', 'bake', 'eat'],
              translations: new Map([
                ['en', 'Pumpkin pie'],
                ['fr', 'Tarte à la citrouille'],
              ]),
            },
          ],
          [
            'spaghetti-bolonese',
            {
              id: 2,
              title: 'Spaghetti bolonese',
              ingredients: new Set([
                'spaghetti',
                'tomato sauce',
                'minced meat',
              ]),
              steps: ['cook', 'eat'],
              translations: new Map([
                ['en', 'Spaghetti bolonese'],
                ['fr', 'Spaghetti bolonaise'],
              ]),
            },
          ],
        ])

        const updatedObject = updateNestedDataByPath(
          oldData,
          ['pumpkin-pie', 'title'],
          'Pumpkin pie with whipped cream',
        )

        const updatedArray = updateNestedDataByPath(
          oldData,
          ['spaghetti-bolonese', 'steps', '0'],
          'prepare',
        )

        const updatedSet = updateNestedDataByPath(
          oldData,
          ['pumpkin-pie', 'ingredients', '1'],
          'honey',
        )

        const updatedMap = updateNestedDataByPath(
          oldData,
          ['pumpkin-pie', 'translations', 'en'],
          'Best pie ever',
        )

        expect(oldData).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "sugar",
                "spices",
              },
              "steps": [
                "mix",
                "bake",
                "eat",
              ],
              "title": "Pumpkin pie",
              "translations": Map {
                "en" => "Pumpkin pie",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "spaghetti",
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "cook",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
                "fr" => "Spaghetti bolonaise",
              },
            },
          }
        `)

        expect(updatedObject).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "sugar",
                "spices",
              },
              "steps": [
                "mix",
                "bake",
                "eat",
              ],
              "title": "Pumpkin pie with whipped cream",
              "translations": Map {
                "en" => "Pumpkin pie",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "spaghetti",
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "cook",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
                "fr" => "Spaghetti bolonaise",
              },
            },
          }
        `)

        expect(updatedArray).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "sugar",
                "spices",
              },
              "steps": [
                "mix",
                "bake",
                "eat",
              ],
              "title": "Pumpkin pie",
              "translations": Map {
                "en" => "Pumpkin pie",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "spaghetti",
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "prepare",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
                "fr" => "Spaghetti bolonaise",
              },
            },
          }
        `)

        expect(updatedSet).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "honey",
                "spices",
              },
              "steps": [
                "mix",
                "bake",
                "eat",
              ],
              "title": "Pumpkin pie",
              "translations": Map {
                "en" => "Pumpkin pie",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "spaghetti",
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "cook",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
                "fr" => "Spaghetti bolonaise",
              },
            },
          }
        `)

        expect(updatedMap).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "sugar",
                "spices",
              },
              "steps": [
                "mix",
                "bake",
                "eat",
              ],
              "title": "Pumpkin pie",
              "translations": Map {
                "en" => "Best pie ever",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "spaghetti",
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "cook",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
                "fr" => "Spaghetti bolonaise",
              },
            },
          }
        `)
        /* eslint-enable */
      })
    })
  })

  describe('deleteNestedDataByPath', () => {
    it('should delete item from array correctly', () => {
      const oldData = ['one', 'two', 'three']

      const newData = deleteNestedDataByPath(oldData, ['1'])

      expect(newData).not.toBe(oldData) // should not be the same reference

      expect(oldData).toMatchInlineSnapshot(`
        [
          "one",
          "two",
          "three",
        ]
      `)
      expect(newData).toMatchInlineSnapshot(`
        [
          "one",
          "three",
        ]
      `)
    })

    it('should delete item from object correctly', () => {
      const oldData = { title: 'Hello world', id: 1, createdAt: '2021-01-01' }

      const newData = deleteNestedDataByPath(oldData, ['createdAt'])

      expect(newData).not.toBe(oldData) // should not be the same reference

      expect(oldData).toMatchInlineSnapshot(`
        {
          "createdAt": "2021-01-01",
          "id": 1,
          "title": "Hello world",
        }
      `)
      expect(newData).toMatchInlineSnapshot(`
        {
          "id": 1,
          "title": "Hello world",
        }
      `)
    })

    it('should delete item from set', () => {
      const oldData = new Set([123, 321, false, true])

      const newData = deleteNestedDataByPath(oldData, ['1'])

      expect(newData).not.toBe(oldData) // should not be the same reference

      expect(oldData).toMatchInlineSnapshot(`
      Set {
        123,
        321,
        false,
        true,
      }
    `)
      expect(newData).toMatchInlineSnapshot(`
      Set {
        123,
        false,
        true,
      }
    `)
    })

    it('should delete item from map', () => {
      const oldData = new Map([
        ['123', 'one'],
        ['hello', 'two'],
        ['world', 'three'],
      ])

      const newData = deleteNestedDataByPath(oldData, ['world'])

      expect(newData).not.toBe(oldData) // should not be the same reference

      expect(oldData).toMatchInlineSnapshot(`
      Map {
        "123" => "one",
        "hello" => "two",
        "world" => "three",
      }
    `)
      expect(newData).toMatchInlineSnapshot(`
      Map {
        "123" => "one",
        "hello" => "two",
      }
    `)
    })

    describe('nested data', () => {
      it('should delete nested items correctly', () => {
        /* eslint-disable cspell/spellchecker */
        const oldData = new Map([
          [
            'pumpkin-pie',
            {
              id: 1,
              title: 'Pumpkin pie',
              ingredients: new Set(['pumpkin', 'sugar', 'spices']),
              steps: ['mix', 'bake', 'eat'],
              translations: new Map([
                ['en', 'Pumpkin pie'],
                ['fr', 'Tarte à la citrouille'],
              ]),
            },
          ],
          [
            'spaghetti-bolonese',
            {
              id: 2,
              title: 'Spaghetti bolonese',
              ingredients: new Set([
                'spaghetti',
                'tomato sauce',
                'minced meat',
              ]),
              steps: ['cook', 'eat'],
              translations: new Map([
                ['en', 'Spaghetti bolonese'],
                ['fr', 'Spaghetti bolonaise'],
              ]),
            },
          ],
        ])

        const deletedFromSet = deleteNestedDataByPath(oldData, [
          'spaghetti-bolonese',
          'ingredients',
          '0',
        ])

        const deletedFromArray = deleteNestedDataByPath(oldData, [
          'pumpkin-pie',
          'steps',
          '1',
        ])

        const deletedFromObject = deleteNestedDataByPath(oldData, [
          'pumpkin-pie',
          'title',
        ])

        const deletedFromMap = deleteNestedDataByPath(oldData, [
          'spaghetti-bolonese',
          'translations',
          'fr',
        ])

        expect(oldData).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "sugar",
                "spices",
              },
              "steps": [
                "mix",
                "bake",
                "eat",
              ],
              "title": "Pumpkin pie",
              "translations": Map {
                "en" => "Pumpkin pie",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "spaghetti",
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "cook",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
                "fr" => "Spaghetti bolonaise",
              },
            },
          }
        `)

        expect(deletedFromSet).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "sugar",
                "spices",
              },
              "steps": [
                "mix",
                "bake",
                "eat",
              ],
              "title": "Pumpkin pie",
              "translations": Map {
                "en" => "Pumpkin pie",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "cook",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
                "fr" => "Spaghetti bolonaise",
              },
            },
          }
        `)

        expect(deletedFromArray).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "sugar",
                "spices",
              },
              "steps": [
                "mix",
                "eat",
              ],
              "title": "Pumpkin pie",
              "translations": Map {
                "en" => "Pumpkin pie",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "spaghetti",
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "cook",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
                "fr" => "Spaghetti bolonaise",
              },
            },
          }
        `)

        expect(deletedFromObject).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "sugar",
                "spices",
              },
              "steps": [
                "mix",
                "bake",
                "eat",
              ],
              "translations": Map {
                "en" => "Pumpkin pie",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "spaghetti",
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "cook",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
                "fr" => "Spaghetti bolonaise",
              },
            },
          }
        `)

        expect(deletedFromMap).toMatchInlineSnapshot(`
          Map {
            "pumpkin-pie" => {
              "id": 1,
              "ingredients": Set {
                "pumpkin",
                "sugar",
                "spices",
              },
              "steps": [
                "mix",
                "bake",
                "eat",
              ],
              "title": "Pumpkin pie",
              "translations": Map {
                "en" => "Pumpkin pie",
                "fr" => "Tarte à la citrouille",
              },
            },
            "spaghetti-bolonese" => {
              "id": 2,
              "ingredients": Set {
                "spaghetti",
                "tomato sauce",
                "minced meat",
              },
              "steps": [
                "cook",
                "eat",
              ],
              "title": "Spaghetti bolonese",
              "translations": Map {
                "en" => "Spaghetti bolonese",
              },
            },
          }
        `)
        /* eslint-enable */
      })
    })
  })

  describe('getMutationStatusColor', () => {
    const cases: Array<{
      label: string
      status: MutationStatus
      isPaused: boolean
      expected: string
    }> = [
      {
        label: 'paused',
        status: 'pending',
        isPaused: true,
        expected: 'purple',
      },
      {
        label: 'paused even when status is "error"',
        status: 'error',
        isPaused: true,
        expected: 'purple',
      },
      { label: '"error"', status: 'error', isPaused: false, expected: 'red' },
      {
        label: '"pending"',
        status: 'pending',
        isPaused: false,
        expected: 'yellow',
      },
      {
        label: '"success"',
        status: 'success',
        isPaused: false,
        expected: 'green',
      },
      { label: '"idle"', status: 'idle', isPaused: false, expected: 'gray' },
    ]

    it.each(cases)(
      'should return "$expected" when mutation is $label',
      ({ status, isPaused, expected }) => {
        expect(getMutationStatusColor({ status, isPaused })).toBe(expected)
      },
    )
  })

  describe('getQueryStatusColorByLabel', () => {
    it('should return "green" for "fresh"', () => {
      expect(getQueryStatusColorByLabel('fresh')).toBe('green')
    })

    it('should return "yellow" for "stale"', () => {
      expect(getQueryStatusColorByLabel('stale')).toBe('yellow')
    })

    it('should return "purple" for "paused"', () => {
      expect(getQueryStatusColorByLabel('paused')).toBe('purple')
    })

    it('should return "gray" for "inactive"', () => {
      expect(getQueryStatusColorByLabel('inactive')).toBe('gray')
    })

    it('should return "blue" for "fetching"', () => {
      expect(getQueryStatusColorByLabel('fetching')).toBe('blue')
    })
  })

  describe('displayValue', () => {
    it('should stringify a primitive value', () => {
      expect(displayValue('hello')).toBe('"hello"')
    })

    it('should stringify a number', () => {
      expect(displayValue(42)).toBe('42')
    })

    it('should serialize an object using superjson and discard meta', () => {
      expect(displayValue({ a: 1, b: 'two' })).toBe('{"a":1,"b":"two"}')
    })

    it('should return "null" for "undefined" since only the json part is used', () => {
      expect(displayValue(undefined)).toBe('null')
    })

    it('should return a single-line string by default', () => {
      expect(displayValue({ a: 1 })).toBe('{"a":1}')
    })

    it('should return an indented multi-line string when "beautify" is true', () => {
      expect(displayValue({ a: 1 }, true)).toBe('{\n  "a": 1\n}')
    })
  })

  describe('getSidedProp', () => {
    it('should append capitalized "top" to the prop', () => {
      expect(getSidedProp('margin', 'top')).toBe('marginTop')
    })

    it('should append capitalized "bottom" to the prop', () => {
      expect(getSidedProp('margin', 'bottom')).toBe('marginBottom')
    })

    it('should append capitalized "left" to the prop', () => {
      expect(getSidedProp('padding', 'left')).toBe('paddingLeft')
    })

    it('should append capitalized "right" to the prop', () => {
      expect(getSidedProp('padding', 'right')).toBe('paddingRight')
    })
  })

  describe('convertRemToPixels', () => {
    beforeEach(() => {
      document.documentElement.style.fontSize = '16px'
    })

    afterEach(() => {
      document.documentElement.style.fontSize = ''
    })

    it('should convert 1 rem to the document root font size in pixels', () => {
      expect(convertRemToPixels(1)).toBe(16)
    })

    it('should return 0 for 0 rem', () => {
      expect(convertRemToPixels(0)).toBe(0)
    })

    it('should multiply rem by the document root font size', () => {
      expect(convertRemToPixels(2)).toBe(32)
    })

    it('should support decimal rem values', () => {
      expect(convertRemToPixels(0.5)).toBe(8)
    })

    it('should reflect the current document root font size', () => {
      document.documentElement.style.fontSize = '20px'
      expect(convertRemToPixels(1)).toBe(20)
    })

    it('should support negative rem values', () => {
      expect(convertRemToPixels(-1)).toBe(-16)
    })

    it('should support non-integer font sizes', () => {
      document.documentElement.style.fontSize = '15.5px'
      expect(convertRemToPixels(1)).toBe(15.5)
    })
  })

  describe('setupStyleSheet', () => {
    afterEach(() => {
      document.head.querySelector('#_goober')?.remove()
    })

    it('should not insert any style tag when "nonce" is missing', () => {
      setupStyleSheet()

      expect(document.head.querySelector('#_goober')).toBeNull()
    })

    it('should not insert any style tag when "nonce" is an empty string', () => {
      setupStyleSheet('')

      expect(document.head.querySelector('#_goober')).toBeNull()
    })

    it('should append a style tag with id "_goober" to "document.head"', () => {
      setupStyleSheet('test-nonce')

      const styleTag = document.head.querySelector('#_goober')
      expect(styleTag).not.toBeNull()
      expect(styleTag?.tagName).toBe('STYLE')
    })

    it('should set the "nonce" attribute on the inserted style tag', () => {
      setupStyleSheet('test-nonce')

      expect(
        document.head.querySelector('#_goober')?.getAttribute('nonce'),
      ).toBe('test-nonce')
    })

    it('should not insert a duplicate style tag when "document.head" already has one', () => {
      setupStyleSheet('first-nonce')
      setupStyleSheet('second-nonce')

      const styleTags = document.head.querySelectorAll('#_goober')
      expect(styleTags).toHaveLength(1)
      expect(styleTags[0]?.getAttribute('nonce')).toBe('first-nonce')
    })

    it('should append the style tag to the provided "ShadowRoot" target', () => {
      const host = document.createElement('div')
      const shadow = host.attachShadow({ mode: 'open' })

      setupStyleSheet('test-nonce', shadow)

      expect(shadow.querySelector('#_goober')).not.toBeNull()
      expect(document.head.querySelector('#_goober')).toBeNull()
    })

    it('should not insert a duplicate style tag when the target already has one', () => {
      const host = document.createElement('div')
      const shadow = host.attachShadow({ mode: 'open' })

      setupStyleSheet('first-nonce', shadow)
      setupStyleSheet('second-nonce', shadow)

      const styleTags = shadow.querySelectorAll('#_goober')
      expect(styleTags).toHaveLength(1)
      expect(styleTags[0]?.getAttribute('nonce')).toBe('first-nonce')
    })
  })

  describe('sortFns', () => {
    let queryClient: QueryClient

    function buildQuery(
      queryKey: ReadonlyArray<unknown>,
      state?: Partial<Query['state']>,
    ): Query {
      const query = queryClient.getQueryCache().build(queryClient, { queryKey })
      if (state) {
        query.setState(state)
      }
      return query
    }

    beforeEach(() => {
      queryClient = new QueryClient()
    })

    afterEach(() => {
      queryClient.clear()
    })

    describe("'last updated'", () => {
      const dateSort = sortFns['last updated']!

      it('should place the more recently updated query first', () => {
        const older = buildQuery(['a'], { dataUpdatedAt: 100 })
        const newer = buildQuery(['b'], { dataUpdatedAt: 200 })

        expect(dateSort(older, newer)).toBe(1)
        expect(dateSort(newer, older)).toBe(-1)
      })
    })

    describe("'query hash'", () => {
      const queryHashSort = sortFns['query hash']!

      it('should sort queries by query hash alphabetically', () => {
        const a = buildQuery(['a'])
        const b = buildQuery(['b'])

        expect(queryHashSort(a, b)).toBeLessThan(0)
        expect(queryHashSort(b, a)).toBeGreaterThan(0)
      })

      it('should return 0 when query hashes are identical', () => {
        const a = buildQuery(['same'])
        const b = buildQuery(['same'])

        expect(queryHashSort(a, b)).toBe(0)
      })
    })

    describe("'status'", () => {
      const statusSort = sortFns['status']!

      function addObserver(query: Query) {
        const observer = new QueryObserver(queryClient, {
          queryKey: query.queryKey,
          enabled: false,
        })
        return observer.subscribe(() => {})
      }

      it('should place a fetching query before an idle one', () => {
        const fetching = buildQuery(['fetching'], {
          fetchStatus: 'fetching',
          dataUpdatedAt: 100,
        })
        const idle = buildQuery(['idle'], {
          fetchStatus: 'idle',
          dataUpdatedAt: 100,
        })
        const unsubscribe = addObserver(idle)

        try {
          expect(statusSort(fetching, idle)).toBe(-1)
          expect(statusSort(idle, fetching)).toBe(1)
        } finally {
          unsubscribe()
        }
      })

      it('should place an inactive (no observers) query last', () => {
        const active = buildQuery(['active'], {
          fetchStatus: 'idle',
          dataUpdatedAt: 100,
        })
        const inactive = buildQuery(['inactive'], {
          fetchStatus: 'idle',
          dataUpdatedAt: 100,
        })
        const unsubscribe = addObserver(active)

        try {
          expect(statusSort(active, inactive)).toBe(-1)
          expect(statusSort(inactive, active)).toBe(1)
        } finally {
          unsubscribe()
        }
      })

      it('should fall back to "last updated" sort within the same status rank', () => {
        const older = buildQuery(['older'], { dataUpdatedAt: 100 })
        const newer = buildQuery(['newer'], { dataUpdatedAt: 200 })

        expect(statusSort(older, newer)).toBe(1)
        expect(statusSort(newer, older)).toBe(-1)
      })
    })
  })

  describe('mutationSortFns', () => {
    let queryClient: QueryClient

    const defaultMutationState: Mutation['state'] = {
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      status: 'idle',
      variables: undefined,
      submittedAt: 0,
    }

    function buildMutation(overrides: Partial<Mutation['state']>): Mutation {
      return queryClient
        .getMutationCache()
        .build(queryClient, {}, { ...defaultMutationState, ...overrides })
    }

    beforeEach(() => {
      queryClient = new QueryClient()
    })

    afterEach(() => {
      queryClient.clear()
    })

    describe("'last updated'", () => {
      const mutationDateSort = mutationSortFns['last updated']!

      it('should place the more recently submitted mutation first', () => {
        const older = buildMutation({ submittedAt: 100 })
        const newer = buildMutation({ submittedAt: 200 })

        expect(mutationDateSort(older, newer)).toBe(1)
        expect(mutationDateSort(newer, older)).toBe(-1)
      })
    })

    describe("'status'", () => {
      const mutationStatusSort = mutationSortFns['status']!

      it('should place a paused mutation first', () => {
        const paused = buildMutation({
          isPaused: true,
          status: 'pending',
          submittedAt: 100,
        })
        const pending = buildMutation({
          isPaused: false,
          status: 'pending',
          submittedAt: 100,
        })

        expect(mutationStatusSort(paused, pending)).toBe(-1)
        expect(mutationStatusSort(pending, paused)).toBe(1)
      })

      it('should place a pending mutation before a successful one', () => {
        const pending = buildMutation({
          isPaused: false,
          status: 'pending',
          submittedAt: 100,
        })
        const success = buildMutation({
          isPaused: false,
          status: 'success',
          submittedAt: 100,
        })

        expect(mutationStatusSort(pending, success)).toBe(-1)
        expect(mutationStatusSort(success, pending)).toBe(1)
      })

      it('should place an errored mutation before a successful one', () => {
        const error = buildMutation({
          isPaused: false,
          status: 'error',
          submittedAt: 100,
        })
        const success = buildMutation({
          isPaused: false,
          status: 'success',
          submittedAt: 100,
        })

        expect(mutationStatusSort(error, success)).toBe(-1)
        expect(mutationStatusSort(success, error)).toBe(1)
      })

      it('should fall back to "last updated" sort within the same status rank', () => {
        const older = buildMutation({
          isPaused: false,
          status: 'success',
          submittedAt: 100,
        })
        const newer = buildMutation({
          isPaused: false,
          status: 'success',
          submittedAt: 200,
        })

        expect(mutationStatusSort(older, newer)).toBe(1)
        expect(mutationStatusSort(newer, older)).toBe(-1)
      })
    })
  })
})
