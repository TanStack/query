import { ESLintUtils } from '@typescript-eslint/utils'
import { exhaustiveDepsRule } from './exhaustive-deps.rule'

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  settings: {},
})

ruleTester.run('exhaustive-deps', exhaustiveDepsRule, {
  valid: [
    {
      name: 'should pass when deps are passed in array',
      code: 'useQuery({ queryKey: ["todos"], queryFn: fetchTodos });',
    },
    {
      name: 'should pass when deps are passed in array',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });',
    },
    {
      name: 'should pass when deps are passed in template literal',
      // eslint-disable-next-line no-template-curly-in-string
      code: 'useQuery({ queryKey: [`entity/${id}`], queryFn: () => api.getEntity(id) });',
    },
    {
      name: 'should not pass fetch',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => fetch(id) });',
    },
    {
      name: 'should not pass axios.get',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => axios.get(id) });',
    },
    {
      name: 'should not pass api.entity.get',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => api.entity.get(id) });',
    },
  ],
  invalid: [
    {
      name: 'should fail when deps are missing in query factory',
      code: `
        const todoQueries = {
          list: () => ({ queryKey: ['entity'], queryFn: fetchEntities }),
          detail: (id) => ({ queryKey: ['entity'], queryFn: () => fetchEntity(id) })
        }
        `,
      output: `
        const todoQueries = {
          list: () => ({ queryKey: ['entity'], queryFn: fetchEntities }),
          detail: (id) => ({ queryKey: ['entity', id], queryFn: () => fetchEntity(id) })
        }
        `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'id' } }],
    },
    {
      name: 'should fail when no deps are passed',
      code: `
        const id = 1;
        useQuery({ queryKey: ["entity"], queryFn: () => api.getEntity(id) });
      `,
      output: `
        const id = 1;
        useQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'id' } }],
    },
    {
      name: 'should fail when deps are passed incorrectly',
      code: `
        const id = 1;
        useQuery({ queryKey: ["entity/\${id}"], queryFn: () => api.getEntity(id) });
      `,
      output: `
        const id = 1;
        useQuery({ queryKey: ["entity/\${id}", id], queryFn: () => api.getEntity(id) });
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'id' } }],
    },
    {
      name: 'should pass missing dep while key has a template literal',
      code: `
        const a = 1;
        const b = 2;
        useQuery({ queryKey: [\`entity/\${a}\`], queryFn: () => api.getEntity(a, b) });
      `,
      output: `
        const a = 1;
        const b = 2;
        useQuery({ queryKey: [\`entity/\${a}\`, b], queryFn: () => api.getEntity(a, b) });
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'b' } }],
    },
    {
      name: 'should fail when dep exists inside setter and missing in queryKey',
      code: `
        const [id] = React.useState(1);
        useQuery({
            queryKey: ["entity"],
            queryFn: () => {
                const { data } = axios.get(\`.../\${id}\`);
                return data;
            }
        });
      `,
      output: `
        const [id] = React.useState(1);
        useQuery({
            queryKey: ["entity", id],
            queryFn: () => {
                const { data } = axios.get(\`.../\${id}\`);
                return data;
            }
        });
      `,
      errors: [{ messageId: 'missingDeps', data: { deps: 'id' } }],
    },
  ],
})
