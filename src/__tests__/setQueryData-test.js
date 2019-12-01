import { setQueryData } from '../index'

test('setQueryData does not crash if query could not be found', () => {
  expect(() =>
    setQueryData(['USER', { userId: 1 }], prevUser => ({
      ...prevUser,
      name: 'Edvin',
    }))
  ).not.toThrow()
})
