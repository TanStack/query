---
id: field
title: <Field />
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/field.md
---

`<Field />` will automagically hook up inputs to Formik. It uses the `name`
attribute to match up with Formik state. `<Field />` will default to an HTML
`<input />` element.

## Rendering

There are different ways to render things with `<Field>`.

- `<Field as>`
- `<Field children>`
- ~~`<Field render>`~~ _deprecated in 2.x. Using these will log warning_
- `<Field component>`

`as` can either be a React component or the name of an HTML element to render. Formik will automagically inject `onChange`, `onBlur`, `name`, and `value` props of the field designated by the `name` prop to the (custom) component.

`children` can either be an array of elements (e.g. `<option>` in the case of `<Field as="select">`) or a callback function (a.k.a render prop). The render props are an object containing:

`component` can either be a React component or the name of an HTML element to render. All additional props will be passed through.

- `field`: An object containing `onChange`, `onBlur`, `name`, and `value` of the field (see [`FieldInputProps`](/docs/api/useField#fieldinputprops))
- `form`: The Formik bag
- `meta`: An object containing metadata (i.e. `value`, `touched`, `error`, and `initialValue`) about the field (see [`FieldMetaProps`](/docs/api/useField#fieldmetaprops))

> In Formik 0.9 to 1.x, `component` and `render` props could also be used for rendering. These have been deprecated since 2.x. While the code still lives within `<Field>`, they will show a warning in the console.

## Example

```jsx
import React from 'react';
import { Field, Form, Formik, FormikProps } from 'formik';

const MyInput = ({ field, form, ...props }) => {
  return <input {...field} {...props} />;
};

const Example = () => (
  <div>
    <h1>My Form</h1>
    <Formik
      initialValues={{ email: '', color: 'red', firstName: '', lastName: '' }}
      onSubmit={(values, actions) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          actions.setSubmitting(false);
        }, 1000);
      }}
    >
      {(props: FormikProps<any>) => (
        <Form>
          <Field type="email" name="email" placeholder="Email" />
          <Field as="select" name="color">
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
          </Field>

          <Field name="lastName">
            {({
              field, // { name, value, onChange, onBlur }
              form: { touched, errors }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
              meta,
            }) => (
              <div>
                <input type="text" placeholder="Email" {...field} />
                {meta.touched && meta.error && (
                  <div className="error">{meta.error}</div>
                )}
              </div>
            )}
          </Field>
          <Field name="lastName" placeholder="Doe" component={MyInput} />
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

### `as`

`as?: string | React.ComponentType<FieldProps['field']>`

Either a React component or the name of an HTML element to render. That is, one of the following:

- `input`
- `select`
- `textarea`
- A valid HTML element name
- A custom React component

Custom React components will be passed `onChange`, `onBlur`, `name`, and `value` plus any other props passed to directly to `<Field>`.

Default is `'input'` (so an `<input>` is rendered by default)

```jsx
// Renders an HTML <input> by default
<Field name="lastName" placeholder="Last Name"/>

// Renders an HTML <select>
<Field name="color" as="select" placeholder="Favorite Color">
  <option value="red">Red</option>
  <option value="green">Green</option>
  <option value="blue">Blue</option>
</Field>

// Renders a CustomInputComponent
<Field name="firstName" as={CustomInputComponent} placeholder="First Name"/>

const CustomInputComponent = (props) => (
  <input className="my-custom-input" type="text" {...props} />
);
```

### `children`

`children?: React.ReactNode | ((props: FieldProps) => React.ReactNode)`

Either JSX elements or callback function. Same as `render`.

```jsx
// Children can be JSX elements
<Field name="color" as="select" placeholder="Favorite Color">
  <option value="red">Red</option>
  <option value="green">Green</option>
  <option value="blue">Blue</option>
</Field>

// Or a callback function
<Field name="firstName">
{({ field, form, meta }) => (
  <div>
    <input type="text" {...field} placeholder="First Name"/>
    {meta.touched &&
      meta.error && <div className="error">{meta.error}</div>}
  </div>
)}
</Field>
```

### `component`

`component?: string | React.ComponentType<FieldProps>`

Either a React component or the name of an HTML element to render. That is, one of the following:

- `input`
- `select`
- `textarea`
- A custom React component

Custom React components will be passed `FieldProps` which is same `render` prop parameters of `<Field render>` plus any other props passed to directly to `<Field>`.

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

**Deprecated in 2.x. Use `children` instead.**

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
/ `withFormik`. This function can either be synchronous or asynchronous:

- Sync: if invalid, return a `string` containing the error message or
  return `undefined`.

- Async: return a Promise that throws a `string` containing the error message.
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
