import { rule, name } from './prefer-query-object-syntax'
import { normalizeIndent } from '../../utils/test-utils'
import { ESLintUtils } from '@typescript-eslint/utils'

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  settings: {},
})

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
        const result = createQuery({ queryKey, queryFn, enabled });
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
    {
      code: normalizeIndent`
        useMutation()
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/react-query";
        useMutation();
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/react-query";
        useMutation({ mutationKey, mutationFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/react-query";
        const result = useMutation({ mutationKey, mutationFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { createMutation } from "@tanstack/solid-query";
        const result = createMutation({ mutationKey, mutationFn, enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "somewhere-else";
        useMutation(mutationKey, mutationFn, { enabled });
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/react-query";
        const getPosts = async () => Promise.resolve([]);
        const postsQuery = { mutationKey: ["posts"], mutationFn: () => getPosts() };
        const usePosts = () => useMutation(postsQuery);
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
    {
      code: normalizeIndent`
        import { createQuery } from "@tanstack/solid-query";
        createQuery(
          ['key'],
          () => Promise.resolve('data')
        );
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { createQuery } from "@tanstack/solid-query";
        createQuery({ queryKey: ['key'], queryFn: () => Promise.resolve('data') });
      `,
    },
    {
      code: normalizeIndent`
        import { createQuery } from "@tanstack/solid-query";
        createQuery(
          ['key'], () => Promise.resolve('data')
        );
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { createQuery } from "@tanstack/solid-query";
        createQuery({ queryKey: ['key'], queryFn: () => Promise.resolve('data') });
      `,
    },
    {
      code: normalizeIndent`
          import { createQuery } from "@tanstack/solid-query";
          createQuery<string>(['key'], () => Promise.resolve('data'));
        `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
          import { createQuery } from "@tanstack/solid-query";
          createQuery<string>({ queryKey: ['key'], queryFn: () => Promise.resolve('data') });
        `,
    },
    {
      code: normalizeIndent`
          import { createQuery } from "@tanstack/solid-query";
          createQuery<
            A,
            B
          >(['key'], () => Promise.resolve('data'));
        `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
          import { createQuery } from "@tanstack/solid-query";
          createQuery<
            A,
            B
          >({ queryKey: ['key'], queryFn: () => Promise.resolve('data') });
        `,
    },
    {
      code: normalizeIndent`
            import { createQuery } from "@tanstack/solid-query";
            const queryKeys = {  userById: (userId: string) => ["users", {userId}] }
            createQuery(queryKeys.userById(userId), async () => await fetchUserById(userId));
          `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
            import { createQuery } from "@tanstack/solid-query";
            const queryKeys = {  userById: (userId: string) => ["users", {userId}] }
            createQuery({ queryKey: queryKeys.userById(userId), queryFn: async () => await fetchUserById(userId) });
          `,
    },
    {
      code: normalizeIndent`
          import { useMutation } from "@tanstack/react-query";
          useMutation(["mutation", "key"], async () => await fetchUserById(userId));
        `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
          import { useMutation } from "@tanstack/react-query";
          useMutation({ mutationKey: ["mutation", "key"], mutationFn: async () => await fetchUserById(userId) });
        `,
    },
    {
      code: normalizeIndent`
          import { useMutation } from "@tanstack/react-query";
          useMutation(async () => await fetchUserById(userId));
        `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
          import { useMutation } from "@tanstack/react-query";
          useMutation({ mutationFn: async () => await fetchUserById(userId) });
        `,
    },
    {
      code: normalizeIndent`
          import { createMutation } from "@tanstack/solid-query";
          createMutation(["mutation", "key"], async () => await fetchUserById(userId));
        `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
          import { createMutation } from "@tanstack/solid-query";
          createMutation({ mutationKey: ["mutation", "key"], mutationFn: async () => await fetchUserById(userId) });
        `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/vue-query";
        useMutation(() => Promise.resolve(3), { onSuccess: () => {} });
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useMutation } from "@tanstack/vue-query";
        useMutation({ mutationFn: () => Promise.resolve(3), onSuccess: () => {} });
      `,
    },
    {
      code: normalizeIndent`
        import { useMutation } from "@tanstack/vue-query";
        useMutation(() => Promise.resolve(3), { onSuccess: () => {}, mutationKey: ["foo"] });
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useMutation } from "@tanstack/vue-query";
        useMutation({ mutationFn: () => Promise.resolve(3), onSuccess: () => {}, mutationKey: ["foo"] });
      `,
    },
    {
      code: normalizeIndent`
        import { useQuery } from '@tanstack/vue-query';
        const options = { enabled: true };
        useQuery(['foo'], () => undefined, options);
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
      output: normalizeIndent`
        import { useQuery } from '@tanstack/vue-query';
        const options = { enabled: true };
        useQuery({ queryKey: ['foo'], queryFn: () => undefined, ...options });
      `,
    },
  ],
})
