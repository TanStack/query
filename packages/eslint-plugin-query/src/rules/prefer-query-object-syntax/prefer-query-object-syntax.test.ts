import { rule, name } from './prefer-query-object-syntax'
import { createRuleTester, normalizeIndent } from '../../utils/test-utils'

const ruleTester = createRuleTester()

ruleTester.run(name, rule, {
  valid: [
    {
      code: normalizeIndent`
        useQuery()
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery();
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey, queryFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const result = useQuery({ queryKey, queryFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { createQuery } from "@tanstack/solid-query";
        const result = useQuery({ queryKey, queryFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "somewhere-else";
        useQuery(queryKey, queryFn, { enabled });
      `,
    },
  ],

  invalid: [
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(['data']);
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey: ['data'] });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(queryKey);
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(queryKey, queryFn);
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      // no autofix
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(['data'], () => fetchData());
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey: ['data'], queryFn: () => fetchData() });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(queryKey, queryFn, { enabled });
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey, queryFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(['data'], () => fetchData(), { enabled: false });
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey: ['data'], queryFn: () => fetchData(), enabled: false });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(queryKey, { queryFn, enabled });
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey, queryFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery(['data'], { queryFn: () => fetchData(), enabled: false });
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        useQuery({ queryKey: ['data'], queryFn: () => fetchData(), enabled: false });
      `,
    },
    {
      code: normalizeIndent`
        import { createQuery } from "@tanstack/solid-query";
        createQuery(['data'], { queryFn: () => fetchData(), enabled: false });
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { createQuery } from "@tanstack/solid-query";
        createQuery({ queryKey: ['data'], queryFn: () => fetchData(), enabled: false });
      `,
    },
  ],
})
