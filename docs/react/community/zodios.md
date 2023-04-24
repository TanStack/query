---
id: zodios-by-ecyrbe
title: Zodios
---

Zodios is a REST API toolbox with end-to-end typesafety, frontend and backend. It comes with some packages and plugins to make the data fetching a lot easier and what is best typesafe all the way to the query without having to remember query keys!

## Installation
You can install multiple packages as you see fit for your project, however if you are doing frontend data fetching with react query all you would have to install are the ones below, you would need to install axios as under the hood that is the library to fetch data

```bash
$ npm i @tanstack/react-query @zodios/core @zodios/react axios
# or
$ pnpm add @tanstack/react-query @zodios/core @zodios/react axios
# or
$ yarn add @tanstack/react-query @zodios/core @zodios/react axios
```

## Quick start

start by defining a `new Zodios` base url

```tsx
import { Zodios, makeErrors } from "@zodios/core";
import { ZodiosHooks } from "@zodios/react";

import { z, } from "zod";


// using zod to get the type of the todo
const todo = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
});

// type safe errors that we can throw on the client
const errors = makeErrors([
  {
    status: "default",
    schema: z.object({
      error: z.object({
        code: z.number(),
        message: z.string(),
      }),
    }),
  },
]);

export const ZodiosClient = new Zodios(
  "https://jsonplaceholder.typicode.com",
  // these are all the methods that the we could have in this case we have 2
  // one to get posts by specific Id
  // two to make a put request to that specific Id
  [
    {
      // the method we use `HTTPS`
      method: "get",
      // this is  dynamic zodios is smart enough to create a query key based of this
      path: `/posts/:id`,
      // using this we can invalidate queries later
      alias: "getMockData",
      // the response we get back from API
      response: z.array(todo),

      errors,
    },
    {
      method: "put",
      path: "/posts/:id",
      alias: "postMockData",
      response: todo,
      // this are the parameters that you would need to pass to your put request
      parameters: [
        {
          name: "data",
          type: "Body",
          schema: todo,
        },
      ],
    },
  ],
  {
    // axios config that you would need as you see fit
  }
);

// we also need to initialize our hooks to fetch data
export const ApiHooks = new ZodiosHooks("my-cool-api", ZodiosClient);
// with this we now can start fetching and updating data as we need

```

### Usage

```tsx
 const {
    data,
    isLoading,
    error,
  } = ApiHooks.useQuery("/posts/:id", {
    params: { id: 1 },
  });

  // with this we would fetch our todo, the great thing about this is that we do not have to declare any keys, zodios is smart enough and will create a query key that would look something like this
  // [{"api":""my-cool-api","path":"/posts"},{}]

  ```

another way we could get the same data is

```tsx
  const { data, isRefetching } = ApiHooks.useGet("/posts/:id", {
    params: {
      id: 1
    }
  });

```
zodios gives you some hooks that you can use, `useGet`  `usePost`  `usePost` and others check out form [MORE](https://www.zodios.org/docs/client/react)


### Mutation and Invalidations

since under the hood zodios also uses `react-query` we can invalidate queries as well. There are two options of query invalidation using `getKeyByPath` or `getKeyByAlias`

in the example below

```tsx
import { useQueryClient } from "@tanstack/react-query";

const CoolButton = () => {
  const queryClient = useQueryClient();
  // our mutation would look something like this
  const { mutate } = apiHook.usePut("/posts/:id", {
    params: { id: 1 }
  });

// body data that is passed
  const bodyData = {
    userId: 1,
    id: 1,
    title: "Sample Titlesss",
    body: "cool-body"
  };

  return (
    <button
      onClick={() => {
        {/* the mutate function is all typesafe, therefore if you pass something that does not match the correct typing it will start complaining */}
        mutate(bodyData, {
          onSuccess: (data) => {
            {/* invalidate queries */}
            queryClient.invalidateQueries({
              {/* by doing this we have acess to all query keys, litte helper from zodios and will invalidate the data  */}
              queryKey: apiHook.getKeyByAlias("getMockData")
            });
          }
        });
      }}
    >
      CLICK ME
    </button>
  );
};

```

Check the complete documentation [Zodios](https://www.zodios.org/docs/intro).
