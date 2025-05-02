import { sleep } from './sleep'

export const simpleFetcher = () => sleep(0).then(() => 'Some data')
