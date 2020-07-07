---
id: arrays
title: Arrays and Nested Objects
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/guides/arrays.md
---

Formik has support for nested objects and arrays out of the box. These 2 subjects are somewhat related because they both leverage the same syntax.

## Nested Objects

The `name` props in Formik can use lodash-like dot paths to reference nested Formik values. This means that you do not need to flatten out your form's values anymore.

```jsx
import React from 'react';
import { Formik, Form, Field } from 'formik';

export const NestedExample = () => (
  <div>
    <h1>Social Profiles</h1>
    <Formik
      initialValues={{
        social: {
          facebook: '',
          twitter: '',
        },
      }}
      onSubmit={values => {
        // same shape as initial values
        console.log(values);
      }}
    >
      <Field name="social.facebook" />
      <Field name="social.twitter" />
      <button type="submit">Submit</button>
    </Formik>
  </div>
);
```

## Arrays

Formik also has support for arrays and arrays of objects out of the box. Using lodash-like bracket syntax for `name` string you can quickly build fields for items in a list.

```jsx
import React from 'react';
import { Formik, Form, Field } from 'formik';

export const BasicArrayExample = () => (
  <div>
    <h1>Friends</h1>
    <Formik
      initialValues={{
        friends: ['jared', 'ian'],
      }}
      onSubmit={values => {
        // same shape as initial values
        console.log(values);
      }}
    >
      <Field name="friends[0]" />
      <Field name="friends[1]" />
      <button type="submit">Submit</button>
    </Formik>
  </div>
);
```

For more information around manipulating (add/remove/etc) items in lists, see the API reference section on the `<FieldArray>` component.
