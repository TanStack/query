---
id: field
title: <Field />
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/field.md
---

`<Field />` will automagically hook up inputs to Formik. It uses the `name`
attribute to match up with Formik state. `<Field />` will default to an HTML
`<input />` element.

## Field render props

There are 3 ways to render things with `<Field>`.

* `<Field component>`
* `<Field render>`
* `<Field children>`

Aside from string-only `component`, each render prop is passed the same props for your convenience.

Field's render props are an object containing:

* `field`: An object containing `onChange`, `onBlur`, `name`, and `value` of the field
* `form`: Formik state and helpers
* Any other props passed to field

## Example

```jsx
import React from 'react';
import { Formik, Field } from 'formik';

const Example = () => (
  <div>
    <h1>My Form</h1>
    <Formik
      initialValues={{ email: '', color: 'red', firstName: '' }}
      onSubmit={(values, actions) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          actions.setSubmitting(false);
        }, 1000);
      }}
      render={(props: FormikProps<Values>) => (
        <form onSubmit={props.handleSubmit}>
          <Field type="email" name="email" placeholder="Email" />
          <Field component="select" name="color">
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
          </Field>
          <Field name="firstName" component={CustomInputComponent} />
          <Field
            name="lastName"
            render={({ field /* _form */ }) => (
              <input {...field} placeholder="lastName" />
            )}
          />
          <button type="submit">Submit</button>
        </form>
      )}
    />
  </div>
);

const CustomInputComponent = ({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => (
  <div>
    <input type="text" {...field} {...props} />
    {touched[field.name] &&
      errors[field.name] && <div className="error">{errors[field.name]}</div>}
  </div>
);
```



## Table of Contents

---

# Reference

## Props

### `children`

`children?: React.ReactNode | ((props: FieldProps) => React.ReactNode)`

Either JSX elements or callback function. Same as `render`.

```jsx
// Children can be JSX elements
<Field name="color" component="select" placeholder="Favorite Color">
  <option value="red">Red</option>
  <option value="green">Green</option>
  <option value="blue">Blue</option>
</Field>

// Or a callback function
<Field name="firstName">
{({ field, form }) => (
  <div>
    <input type="text" {...field} placeholder="First Name"/>
    {form.touched[field.name] &&
      form.errors[field.name] && <div className="error">{form.errors[field.name]}</div>}
  </div>
)}
</Field>
```

### `component`

`component?: string | React.ComponentType<FieldProps>`

Either a React component or the name of an HTML element to render. That is, one of the following:

* `input`
* `select`
* `textarea`
* A custom React Component

Custom React Components will be passed `FieldProps` which is same `render` prop parameters of `<Field render>` plus any other props passed to directly to `<Field>`.

Default is `'input'` (so an `<input>` is rendered by default)

```jsx
// Renders an HTML <input> by default
<Field name="lastName" placeholder="Last Name"/>

// Renders an HTML <select>
<Field name="color" component="select" placeholder="Favorite Color">
  <option value="red">Red</option>
  <option value="green">Green</option>
  <option value="blue">Blue</option>
</Field>

// Renders a CustomInputComponent
<Field name="firstName" component={CustomInputComponent} placeholder="First Name"/>

const CustomInputComponent = ({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => (
  <div>
    <input type="text" {...field} {...props} />
    {touched[field.name] &&
      errors[field.name] && <div className="error">{errors[field.name]}</div>}
  </div>
);
```

### `innerRef`

`innerRef?: (el: React.HTMLElement<any> => void)`

When you are **not** using a custom component and you need to access the underlying DOM node created by `Field` (e.g. to call `focus`), pass the callback to the `innerRef` prop instead.

### `name`

`name: string`
**Required**

A field's name in Formik state. To access nested objects or arrays, name can also accept lodash-like dot path like `social.facebook` or `friends[0].firstName`

### `render`

`render?: (props: FieldProps) => React.ReactNode`

A function that returns one or more JSX elements.

```jsx
// Renders an HTML <input> and passes FieldProps field property
<Field
  name="firstName"
  render={({ field /* { name, value, onChange, onBlur } */ }) => (
    <input {...field} type="text" placeholder="firstName" />
  )}
/>

// Renders an HTML <input> and disables it while form is submitting
<Field
  name="lastName"
  render={({ field, form: { isSubmitting } }) => (
    <input {...field} disabled={isSubmitting} type="text" placeholder="lastName" />
  )}
/>

// Renders an HTML <input> with custom error <div> element
<Field
  name="lastName"
  render={({ field, form: { touched, errors } }) => (
    <div>
      <input {...field} type="text" placeholder="lastName" />
      {touched[field.name] &&
        errors[field.name] && <div className="error">{errors[field.name]}</div>}
    </div>
  )}
/>
```

### `validate`

`validate?: (value: any) => undefined | string | Promise<any>`

You can run independent field-level validations by passing a function to the
`validate` prop. The function will respect the `validateOnBlur` and
`validateOnChange` config/props specified in the `<Field>'s` parent `<Formik>`
/ `withFormik`. This function can be either be synchronous or asynchronous:

* Sync: if invalid, return a `string` containing the error message or
  return `undefined`.

* Async: return a Promise that throws a `string` containing the error message.
  This works like Formik's `validate`, but instead of returning an `errors`
  object, it's just a `string`.

```jsx
import React from 'react';
import { Formik, Form, Field } from 'formik';

// Synchronous validation function
const validate = value => {
  let errorMessage;
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
    errorMessage = 'Invalid email address';
  }
  return errorMessage;
};

// Async validation function
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const validateAsync = value => {
  return sleep(2000).then(() => {
    if (['admin', 'null', 'god'].includes(value)) {
      throw 'Nice try';
    }
  });
};

// example usage
const MyForm = () => (
  <Formik
    initialValues={{ email: '', username: '' }}
    onSubmit={values => alert(JSON.stringify(values, null, 2))}
  >
    {({ errors, touched }) => (
      <Form>
        <Field validate={validate} name="email" type="email" />
        {errors.email && touched.email ? <div>{errors.email}</div> : null}
        <Field validate={validateAsync} name="username" />
        {errors.username && touched.username ? (
          <div>{errors.username}</div>
        ) : null}
        <button type="submit">Submit</button>
      </Form>
    )}
  </Formik>
);
```

Note: To allow for i18n libraries, the TypeScript typings for `validate` are
slightly relaxed and allow you to return a `Function` (e.g. `i18n('invalid')`).
