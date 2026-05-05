import { describe, expect, it } from 'vitest'
import {
  deleteNestedDataByPath,
  getMutationStatusColor,
  getQueryStatusColorByLabel,
  updateNestedDataByPath,
} from '../utils'
import type { MutationStatus } from '@tanstack/query-core'

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
      { label: 'paused', status: 'pending', isPaused: true, expected: 'purple' },
      {
        label: 'paused even when status is "error"',
        status: 'error',
        isPaused: true,
        expected: 'purple',
      },
      { label: '"error"', status: 'error', isPaused: false, expected: 'red' },
      { label: '"pending"', status: 'pending', isPaused: false, expected: 'yellow' },
      { label: '"success"', status: 'success', isPaused: false, expected: 'green' },
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
})
