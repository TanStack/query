import { describe } from "node:test";
import { expectTypeOf, it } from "vitest";
import { type InfiniteData, dataTagSymbol } from "@tanstack/query-core";
import {
  createInfiniteQuery,
  infiniteQueryOptions,
} from "../createInfiniteQuery";
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from "../createInfiniteQuery";

const doNotRun = (_callback: () => void) => {};

describe("infiniteQueryOptions", () => {
  it("should infer defined types", () => {
    const options = infiniteQueryOptions({
      getNextPageParam: () => 10,
      queryKey: ["key"],
      queryFn: () => ({ wow: true }),
      initialData: {
        pageParams: [undefined],
        pages: [{ wow: true }],
      },
      initialPageParam: 0,
    });

    doNotRun(() => {
      expectTypeOf<
        InfiniteData<
          {
            wow: boolean;
          },
          unknown
        >
      >(createInfiniteQuery(() => options).data);

      expectTypeOf<
        ReturnType<
          DefinedInitialDataInfiniteOptions<
            {
              wow: boolean;
            },
            Error,
            InfiniteData<
              {
                wow: boolean;
              },
              unknown
            >,
            Array<string>,
            number | undefined
          >
        >
      >(options);

      expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<
        InfiniteData<{ wow: boolean }>
      >();
    });
  });

  it("should work without defined types", () => {
    const options = infiniteQueryOptions({
      getNextPageParam: () => undefined,
      queryKey: ["key"],
      queryFn: () => ({ wow: true }),
      initialPageParam: 0,
    });

    doNotRun(() => {
      expectTypeOf<
        () =>
          | InfiniteData<
              {
                wow: boolean;
              },
              unknown
            >
          | undefined
      >(() => createInfiniteQuery(() => options).data);

      expectTypeOf<
        ReturnType<
          UndefinedInitialDataInfiniteOptions<
            {
              wow: boolean;
            },
            Error,
            InfiniteData<
              {
                wow: boolean;
              },
              unknown
            >,
            Array<string>,
            number
          >
        >
      >(options);

      expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<
        InfiniteData<{
          wow: boolean;
        }>
      >();
    });
  });
});
