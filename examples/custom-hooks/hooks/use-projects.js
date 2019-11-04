import { useQuery } from 'react-query'

import fetch from '../libs/fetch'

function useProjects() {
  return useQuery('projects', () => fetch('/api/data'))
}

export default useProjects
