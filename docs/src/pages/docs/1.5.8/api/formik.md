---
id: formik
title: <Formik />
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/formik.md
---

`<Formik>` is a component that helps you with building forms. It uses a render
props pattern made popular by libraries like React Motion and React Router.

## Example

```jsx
import React from 'react';
import { Formik } from 'formik';

const BasicExample = () => (
  <div>
    <h1>My Form</h1>
    <Formik
      initialValues={{ name: 'jared' }}
      onSubmit={(values, actions) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          actions.setSubmitting(false);
        }, 1000);
      }}
      render={props => (
        <form onSubmit={props.handleSubmit}>
          <input
            type="text"
            onChange={props.handleChange}
            onBlur={props.handleBlur}
            value={props.values.name}
            name="name"
          />
          {props.errors.name && <div id="feedback">{props.errors.name}</div>}
          <button type="submit">Submit</button>
        </form>
      )}
    />
  </div>
);
```



## Table of Contents

---

# Reference

## Props

### Formik render methods and props

There are three ways to render things with `<Formik />`

* `<Formik component>`
* `<Formik render>`
* `<Formik children>`

All three render methods will be passed the same props:

#### `dirty: boolean`

Returns `true` if values are not deeply equal from initial values, `false` otherwise.
`dirty` is a readonly computed property and should not be mutated directly.

#### `errors: { [field: string]: string }`

Form validation errors. Should match the shape of your form's `values` defined
in `initialValues`. If you are using `validationSchema` (which you should be),
keys and shape will match your schema exactly. Internally, Formik transforms raw
[Yup validation errors](https://github.com/jquense/yup#validationerrorerrors-string--arraystring-value-any-path-string)
on your behalf. If you are using `validate`, then that function will determine
the `errors` objects shape.

#### `handleBlur: (e: any) => void`

`onBlur` event handler. Useful for when you need to track whether an input has
been `touched` or not. This should be passed to `<input onBlur={handleBlur} ... />`

#### `handleChange: (e: React.ChangeEvent<any>) => void`

General input change event handler. This will update the `values[key]` where
`key` is the event-emitting input's `name` attribute. If the `name` attribute is
not present, `handleChange` will look for an input's `id` attribute. Note:
"input" here means all HTML inputs.

#### `handleReset: () => void`

Reset handler. Will reset the form to its initial state. This should be passed
to `<button onClick={handleReset}>...</button>`

#### `handleSubmit: (e: React.FormEvent<HTMLFormEvent>) => void`

Submit handler. This should be passed to `<form onSubmit={props.handleSubmit}>...</form>`. To learn more about the submission process, see [Form Submission](guides/form-submission.md).

#### `isSubmitting: boolean`

Submitting state of the form. Returns `true` if submission is in progress and `false` otherwise. IMPORTANT: Formik will set this to `true` as soon as submission is _attempted_. To learn more about the submission process, see [Form Submission](guides/form-submission.md).

#### `isValid: boolean`

Returns `true` if the there are no `errors`, or the result of
`isInitialValid` the form if is in "pristine" condition (i.e. not `dirty`).

#### `isValidating: boolean`

Returns `true` if Formik is running validation during submission, or by calling [`validateForm`] directly `false` otherwise. To learn more about what happens with `isValidating` during the submission process, see [Form Submission](guides/form-submission.md).

#### `resetForm: (nextValues?: Values) => void`

Imperatively reset the form. This will clear `errors` and `touched`, set
`isSubmitting` to `false`, `isValidating` to `false`, and rerun `mapPropsToValues` with the current
`WrappedComponent`'s `props` or what's passed as an argument. The latter is
useful for calling `resetForm` within `componentWillReceiveProps`.

#### `setErrors: (fields: { [field: string]: string }) => void`

Set `errors` imperatively.

#### `setFieldError: (field: string, errorMsg: string) => void`

Set the error message of a field imperatively. `field` should match the key of
`errors` you wish to update. Useful for creating custom input error handlers.

#### `setFieldTouched: (field: string, isTouched?: boolean, shouldValidate?: boolean) => void`

Set the touched state of a field imperatively. `field` should match the key of
`touched` you wish to update. Useful for creating custom input blur handlers. Calling this method will trigger validation to run if `validateOnBlur` is set to `true` (which it is by default). `isTouched` defaults to `true` if not specified. You can also explicitly prevent/skip validation by passing a third argument as `false`.

#### `submitForm: () => Promise`

Trigger a form submission. The promise will be rejected if form is invalid. 

#### `submitCount: number`

Number of times user tried to submit the form. Increases when [`handleSubmit`](#handlesubmit-e-reactformevent-htmlformevent-void) is called, resets after calling
[`handleReset`](#handlereset-void). `submitCount` is readonly computed property and should not be mutated directly.

#### `setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void`

Set the value of a field imperatively. `field` should match the key of
`values` you wish to update. Useful for creating custom input change handlers. Calling this will trigger validation to run if `validateOnChange` is set to `true` (which it is by default). You can also explicitly prevent/skip validation by passing a third argument as `false`.

#### `setStatus: (status?: any) => void`

Set a top-level `status` to anything you want imperatively. Useful for
controlling arbitrary top-level state related to your form. For example, you can
use it to pass API responses back into your component in `handleSubmit`.

#### `setSubmitting: (isSubmitting: boolean) => void`

Set `isSubmitting` imperatively.

#### `setTouched: (fields: { [field: string]: boolean }) => void`

Set `touched` imperatively.

#### `setValues: (fields: { [field: string]: any }) => void`

Set `values` imperatively.

#### `status?: any`

A top-level status object that you can use to represent form state that can't
otherwise be expressed/stored with other methods. This is useful for capturing
and passing through API responses to your inner component.

`status` should only be modified by calling
[`setStatus`](#setstatus-status-any-void).

#### `touched: { [field: string]: boolean }`

Touched fields. Each key corresponds to a field that has been touched/visited.

#### `values: { [field: string]: any }`

Your form's values. Will have the shape of the result of `mapPropsToValues`
(if specified) or all props that are not functions passed to your wrapped
component.

#### `validateForm: (values?: any) => Promise<FormikErrors<Values>>`

Imperatively call your `validate` or `validateSchema` depending on what was specified. You can optionally pass values to validate against and this modify Formik state accordingly, otherwise this will use the current `values` of the form.

#### `validateField: (field: string) => void`

Imperatively call field's `validate` function if specified for given field. Formik will use the current field value.

### `component?: React.ComponentType<FormikProps<Values>>`

```jsx
<Formik component={ContactForm} />;

const ContactForm = ({
  handleSubmit,
  handleChange,
  handleBlur,
  values,
  errors,
}) => (
  <form onSubmit={handleSubmit}>
    <input
      type="text"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.name}
      name="name"
    />
    {errors.name && <div>{errors.name}</div>}
    <button type="submit">Submit</button>
  </form>
);
```

**Warning:** `<Formik component>` takes precendence over `<Formik render>` so
don’t use both in the same `<Formik>`.

### `render: (props: FormikProps<Values>) => ReactNode`

```jsx
<Formik render={props => <ContactForm {...props} />} />

<Formik
  render={({ handleSubmit, handleChange, handleBlur, values, errors }) => (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={handleChange}
        onBlur={handleBlur}
        value={values.name}
        name="name"
      />
      {errors.name &&
        <div>
          {errors.name}
        </div>}
      <button type="submit">Submit</button>
    </form>
  )}
/>
```

### `children?: React.ReactNode | (props: FormikProps<Values>) => ReactNode`

```jsx
<Formik children={props => <ContactForm {...props} />} />

// or...

<Formik>
  {({ handleSubmit, handleChange, handleBlur, values, errors }) => (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={handleChange}
        onBlur={handleBlur}
        value={values.name}
        name="name"
      />
      {errors.name &&
        <div>
          {errors.name}
        </div>}
      <button type="submit">Submit</button>
    </form>
  )}
</Formik>
```

### `enableReinitialize?: boolean`

Default is `false`. Control whether Formik should reset the form if
`initialValues` changes (using deep equality).

### `isInitialValid?: boolean`

Default is `false`. Control the initial value of `isValid` prop prior to
mount. You can also pass a function. Useful for situations when you want to
enable/disable a submit and reset buttons on initial mount.

### `initialStatus?: any`

An arbitrary value for the initial `status` of the form. If the form is reset, this value will be restored.

Note: `initialStatus` is not available to the higher-order component `withFormik`, use
`mapPropsToStatus` instead.

### `initialValues: Values`

Initial field values of the form, Formik will make these values available to
render methods component as `values`.

Even if your form is empty by default, you must initialize all fields with
initial values otherwise React will throw an error saying that you have changed
an input from uncontrolled to controlled.

Note: `initialValues` not available to the higher-order component, use
`mapPropsToValues` instead.

### `onReset?: (values: Values, formikBag: FormikBag) => void`

Your optional form reset handler. It is passed your forms `values` and the
"FormikBag".

### `onSubmit: (values: Values, formikBag: FormikBag) => void`

Your form submission handler. It is passed your forms `values` and the
"FormikBag", which includes an object containing a subset of the
[injected props and methods](#formik-render-methods-and-props) (i.e. all the methods
with names that start with `set<Thing>` + `resetForm`) and any props that were
passed to the wrapped component.

Note: `errors`, `touched`, `status` and all event handlers are NOT
included in the `FormikBag`.

### `validate?: (values: Values) => FormikErrors<Values> | Promise<any>`

_Note: I suggest using `validationSchema` and Yup for validation. However,
`validate` is a dependency-free, straightforward way to validate your forms._

Validate the form's `values` with function. This function can either be:

1.  Synchronous and return an `errors` object.

```js
// Synchronous validation
const validate = values => {
  let errors = {};

  if (!values.email) {
    errors.email = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }

  //...

  return errors;
};
```

* Asynchronous and return a Promise that's error in an `errors` object

```js
// Async Validation
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const validate = values => {
  return sleep(2000).then(() => {
    let errors = {};
    if (['admin', 'null', 'god'].includes(values.username)) {
      errors.username = 'Nice try';
    }
    // ...
    if (Object.keys(errors).length) {
      throw errors;
    }
  });
};
```

### `validateOnBlur?: boolean`

Default is `true`. Use this option to run validations on `blur` events. More
specifically, when either `handleBlur`, `setFieldTouched`, or `setTouched`
are called.

### `validateOnChange?: boolean`

Default is `true`. Use this option to tell Formik to run validations on `change`
events and `change`-related methods. More specifically, when either
`handleChange`, `setFieldValue`, or `setValues` are called.

### `validationSchema?: Schema | (() => Schema)`

[A Yup schema](https://github.com/jquense/yup) or a function that returns a Yup
schema. This is used for validation. Errors are mapped by key to the inner
component's `errors`. Its keys should match those of `values`.
