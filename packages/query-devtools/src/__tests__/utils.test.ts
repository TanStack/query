import { updateNestedDataByPath } from '../utils'

describe('Utils tests', () => {
  describe('updatedNestedDataByPath', () => {
    describe('array', () => {
      it('should update data correctly', async () => {
        const oldData = ['one', 'two', 'three']

        const newData = updateNestedDataByPath(oldData, ['1'], 'new')

        expect(newData).not.toBe(oldData) // should not be the same reference

        expect(oldData[0]).toEqual('one')
        expect(oldData[1]).toEqual('two')
        expect(oldData[2]).toEqual('three')

        expect(newData[0]).toEqual('one')
        expect(newData[1]).toEqual('new')
        expect(newData[2]).toEqual('three')
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

        expect(oldData['title']).toEqual('Hello world')
        expect(oldData['id']).toEqual(1)
        expect(oldData['createdAt']).toEqual('2021-01-01')

        expect(newData['title']).toEqual('Brave new world')
        expect(newData['id']).toEqual(1)
        expect(newData['createdAt']).toEqual('2021-01-01')
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

        expect(oldData[0]!['title']).toEqual('Hello world')
        expect(oldData[0]!['id']).toEqual(1)
        expect(oldData[0]!['createdAt']).toEqual('2021-01-01')
        expect(oldData[1]!['title']).toEqual('Second post')
        expect(oldData[1]!['id']).toEqual(2)
        expect(oldData[1]!['createdAt']).toEqual('2023-04-02')

        expect(newData[0]['title']).toEqual('Hello world')
        expect(newData[0]['id']).toEqual(1)
        expect(newData[0]['createdAt']).toEqual('2021-01-01')
        expect(newData[1]['title']).toEqual('Second post')
        expect(newData[1]['id']).toEqual(2)
        expect(newData[1]['createdAt']).toEqual('2023-05-01')
      })
    })
  })
})
