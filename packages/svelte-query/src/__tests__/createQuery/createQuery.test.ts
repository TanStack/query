import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import CreateQuery_TypeCheck from "./CreateQuery_TypeCheck.test.svelte";
import CreateQuery from "./CreateQuery.test.svelte";

import {sleep} from '../../../../../../query/packages/svelte-query/src/__tests__/utils'

describe('createQuery', () => {
  it('Render and wait for success', async () => {
    render(CreateQuery, {
      props: {
        queryKey: ['test'],
        queryFn: async () => {
          await sleep(100)
          return 'Success'
        },
      },
    })

    expect(screen.queryByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
    expect(screen.queryByText('Success')).not.toBeInTheDocument()

    await sleep(200)

    expect(screen.queryByText('Success')).toBeInTheDocument()
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
  });

  it('should have types that match the spec.', async () => {
    const {component} = render(CreateQuery_TypeCheck, {
      props: {
      }
    });

    //This is just demo code showing how to access svelte component props. Should be removed later.
    expect(component.queryKey).toBeDefined();
    if (!component.queryKey) {return}
  });
});

