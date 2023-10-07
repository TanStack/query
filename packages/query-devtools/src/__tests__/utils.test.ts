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
  })

  it('should delete nested item from array correctly', async () => {
    const oldData = [
      {
        title: 'Pumpkin pie',
        id: 1,
        ingredients: ['pumpkin', 'pie crust', 'sugar', 'spices'],
      },
      {
        title: 'Spaghetti bolonese',
        id: 2,
        ingredients: ['spaghetti', 'tomato sauce', 'minced meat'],
      },
    ]

    const newData = deleteNestedDataByPath(oldData, ['1', 'ingredients', '0'])

    expect(newData).not.toBe(oldData) // should not be the same reference

    expect(oldData).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
          "ingredients": [
            "pumpkin",
            "pie crust",
            "sugar",
            "spices",
          ],
          "title": "Pumpkin pie",
        },
        {
          "id": 2,
          "ingredients": [
            "spaghetti",
            "tomato sauce",
            "minced meat",
          ],
          "title": "Spaghetti bolonese",
        },
      ]
    `)
    expect(newData).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
          "ingredients": [
            "pumpkin",
            "pie crust",
            "sugar",
            "spices",
          ],
          "title": "Pumpkin pie",
        },
        {
          "id": 2,
          "ingredients": [
            "tomato sauce",
            "minced meat",
          ],
          "title": "Spaghetti bolonese",
        },
      ]
    `)
  })
})
