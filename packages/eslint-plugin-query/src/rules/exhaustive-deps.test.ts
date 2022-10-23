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
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });',
    },
    {
      name: 'should pass when deps are passed in template literal',
      // eslint-disable-next-line no-template-curly-in-string
      code: 'useQuery({ queryKey: [`entity/${id}`], queryFn: () => api.getEntity(id) });',
    },
    {
      name: 'should not pass fetch',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => fetch("...") });',
    },
    {
      name: 'should not pass axios',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => axios.get("...") });',
    },
    {
      name: 'should not pass api',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => api.get("...") });',
    },
  ],
  invalid: [
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
