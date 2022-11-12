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
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getPosts = async () => Promise.resolve([]);
        const postsQuery = { queryKey: ["posts"], queryFn: () => getPosts() };
        const usePosts = () => useQuery(postsQuery);
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getQuery = () => ({ queryKey: ['foo'], queryFn: () => Promise.resolve(5) })
        useQuery(getQuery())
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getQuery = () => {
          return { queryKey: ['foo'], queryFn: () => Promise.resolve(5) };
        }
        useQuery(getQuery())
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getQuery = () => {
          const queryKey = () => ['foo'];
          const queryFn = () => {
            return Promise.resolve(5);
          }
          return { queryKey, queryFn };
        }
        useQuery(getQuery())
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from "@tanstack/react-query";
        const getQuery = () => {
          try {
            return { queryKey: ['foo'], queryFn: () => Promise.resolve(5) };  
          } finally {
            return { queryKey: ['foo'], queryFn: () => Promise.resolve(5) };
          }
        }
        useQuery(getQuery())
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
      const getQuery = () => "foo";
      useQuery(getQuery());
      `,
      errors: [
        {
          messageId: 'returnTypeAreNotObjectSyntax',
          data: { returnType: '"foo"' },
        },
      ],
    },
    {
      code: normalizeIndent`
      import { useQuery } from "@tanstack/react-query";
      const getQuery = (x) => {
        return x
          ? { queryKey: "foo", queryFn: () => Promise.resolve(1) }
          : null;
      };
      useQuery(getQuery(x));
      `,
      errors: [
        {
          messageId: 'returnTypeAreNotObjectSyntax',
          data: {
            returnType: `x\n    ? { queryKey: "foo", queryFn: () => Promise.resolve(1) }\n    : null`,
          },
        },
      ],
    },
    {
      code: normalizeIndent`
      import { useQuery } from "@tanstack/react-query";
      const getQuery = (x) => {
        try {
          return { queryKey: "foo", queryFn: () => Promise.resolve(1) };
        } catch (e) {
          if (x > 1) {
            return { queryKey: "bar", queryFn: () => Promise.resolve(2) };
          } else {
            return null;
          }
        }
      };
      useQuery(getQuery(x));
      `,
      errors: [
        {
          messageId: 'returnTypeAreNotObjectSyntax',
          data: { returnType: 'null' },
        },
      ],
    },
    {
      code: normalizeIndent`
      import { useQuery } from "@tanstack/react-query";
      const getQuery = (x) => {
        switch (x) {
          case 1:
            return { queryKey: "foo", queryFn: () => Promise.resolve(1) };
          default:
            return null;
        }
      };
      useQuery(getQuery(x));
      `,
      errors: [
        {
          messageId: 'returnTypeAreNotObjectSyntax',
          data: { returnType: 'null' },
        },
      ],
    },
    {
      code: normalizeIndent`
      import { useQuery } from "@tanstack/react-query";
      const getQuery = (x, y) => {
        if (x) {
          return { queryKey: "foo", queryFn: () => Promise.resolve(1) };
        } else {
          if (y) {
            return { queryKey: "bar", queryFn: () => Promise.resolve(2) };
          } else {
            return () => Promise.resolve(3);
          }
        }
      };
      useQuery(getQuery(x));
      `,
      errors: [
        {
          messageId: 'returnTypeAreNotObjectSyntax',
          data: { returnType: '() => Promise.resolve(3)' },
        },
      ],
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
