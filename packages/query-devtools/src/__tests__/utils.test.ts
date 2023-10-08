import { deleteNestedDataByPath, updateNestedDataByPath } from '../utils'

describe('Utils tests', () => {
  describe('updatedNestedDataByPath', () => {
    describe('array', () => {
      it('should update data correctly', async () => {
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
      it('should update data correctly', async () => {
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

    describe('nested data', () => {
      it('should update data correctly', async () => {
        const oldData = [
          {
            title: 'Hello world',
            id: 1,
            createdAt: '2021-01-01',
          },
          {
            title: 'Second post',
            id: 2,
            createdAt: '2023-04-02',
          },
        ]

        const newData = updateNestedDataByPath(
          oldData,
          ['1', 'createdAt'],
          '2023-05-01',
        )

        expect(newData).not.toBe(oldData) // should not be the same reference

        expect(oldData).toMatchInlineSnapshot(`
          [
            {
              "createdAt": "2021-01-01",
              "id": 1,
              "title": "Hello world",
            },
            {
              "createdAt": "2023-04-02",
              "id": 2,
              "title": "Second post",
            },
          ]
        `)
        expect(newData).toMatchInlineSnapshot(`
          [
            {
              "createdAt": "2021-01-01",
              "id": 1,
              "title": "Hello world",
            },
            {
              "createdAt": "2023-05-01",
              "id": 2,
              "title": "Second post",
            },
          ]
        `)
      })
    })
  })

  describe('deleteNestedDataByPath', () => {
    it('should delete item from array correctly', async () => {
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

    it('should delete item from object correctly', async () => {
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
      it('should delete nested items correctly', async () => {
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
      })
    })
  })
})
