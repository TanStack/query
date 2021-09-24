import { InitialDataFunction, UseQueryOptions } from 'react-query'
import { expectType } from './utils'

test('initialData', () => {
  type TOutput = 'output'
  type MyQuery = UseQueryOptions<'input', Error, TOutput>

  type TInitialData = MyQuery['initialData']

  type TExpected = undefined | TOutput | InitialDataFunction<TOutput>

  expectType<TExpected>((null as any) as TInitialData)
})
