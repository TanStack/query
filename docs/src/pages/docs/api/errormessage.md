---
id: errormessage
title: <ErrorMessage />
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/errormessage.md
---

`<ErrorMessage />` is a component that renders the error message of a given field if that field has been visited (i.e.`touched[name] === true`) (and there is an `error` message present). It expects that all error messages are stored for a given field as a string. Like `<Field />`, `<FastField />`, and `<FieldArray />`, lodash-like dot path and bracket syntax is supported.

## Example

```diff
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from "yup";

const SignupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Too Short!')
    .max(70, 'Too Long!')
    .required('Required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Required'),
});

export const ValidationSchemaExample = () => (
  <div>
    <h1>Signup</h1>
    <Formik
      initialValues={{
        name: '',
        email: '',
      }}
      validationSchema={SignupSchema}
      onSubmit={values => {
        // same shape as initial values
        console.log(values);
      }}
    >
      {({ errors, touched }) => (
        <Form>
          <Field name="name"  />
-           {errors.name && touched.name ? (
-            <div>{errors.name}</div>
-          ) : null}
+         <ErrorMessage name="name" />
          <Field name="email" type="email" />
-           {errors.email && touched.email ? (
-            <div>{errors.email}</div>
-          ) : null}
+         <ErrorMessage name="email" />
          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  </div>
);
```

#### Props

---

# Reference

## Props

### `children`

`children?: ((message: string) => React.ReactNode)`

A function that returns a valid React element. Will only be called when the field has been touched and an error exists.

```jsx
// the render callback will only be called when the
// field has been touched and an error exists and subsequent updates.
<ErrorMessage name="email">{(msg) => <div>{msg}</div>}</ErrorMessage>
```

### `component`

`component?: string | React.ComponentType<FieldProps>`

Either a React component or the name of an HTML element to render. If not specified, `<ErrorMessage>` will just return a string.

```jsx
<ErrorMessage component="div" name="email" />
// --> {touched.email && error.email ? <div>{error.email}</div> : null}

<ErrorMessage component="span" name="email" />
// --> {touched.email && error.email ? <span>{error.email}</span> : null}

<ErrorMessage component={Custom} name="email" />
// --> {touched.email && error.email ? <Custom>{error.email}</Custom> : null}

<ErrorMessage name="email" />
// This will return a string. React 16+.
// --> {touched.email && error.email ? error.email : null}
```

### `name`

`name: string`
**Required**

A field's name in Formik state. To access nested objects or arrays, name can also accept lodash-like dot path like `social.facebook` or `friends[0].firstName`

### `render`

`render?: (error: string) => React.ReactNode`

A function that returns a valid React element. Will only be called when the field has been touched and an error exists.

```jsx
// the render callback will only be called when the
// field has been touched and an error exists and subsequent updates.
<ErrorMessage name="email" render={(msg) => <div>{msg}</div>} />
```
