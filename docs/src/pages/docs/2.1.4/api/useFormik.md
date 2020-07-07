---
id: useFormik
title: useFormik()
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/useFormik.md
---

`useFormik()` is a custom React hook that will return all Formik state and helpers directly. Despite its name, it is not meant for the majority of use cases. Internally, Formik uses `useFormik` to create the `<Formik>` component (which renders a [React Context](https://reactjs.org/docs/context.html) Provider). If you are trying to access Formik state via context, use [useFormikContext](useFormikContext). Only use this hook if you are NOT using `<Formik>` or `withFormik`.

\*\* Be aware that `<Field>`, `<FastField>`, `<ErrorMessage>`, `connect()`, and `<FieldArray>` will NOT work with `useFormik()` as they all require React Context.

## Use cases for `useFormik()`

- You are Jared
- You are modifying the returned value and creating a modified version of `<Formik>` for your own consumption
- You want to avoid using React Context (possibly for perf reasons)

## Example

```jsx
import React from 'react';
import { useFormik } from 'formik';

const SignupForm = () => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="firstName">First Name</label>
      <input
        id="firstName"
        name="firstName"
        type="text"
        onChange={formik.handleChange}
        value={formik.values.firstName}
      />
      <label htmlFor="lastName">Last Name</label>
      <input
        id="lastName"
        name="lastName"
        type="text"
        onChange={formik.handleChange}
        value={formik.values.lastName}
      />
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        value={formik.values.email}
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

---

# Reference

## `useFormik<Values>(config: FormikConfig<Values>): FormikProps<Values>`

A custom React Hook that returns Formik states and helpers. It is used internally to create the `<Formik>` component, but is exported for advanced use cases or for those people that do not want to use React Context.
