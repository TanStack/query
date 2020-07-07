---
id: withFormik
title: withFormik()
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/withFormik.md
---

Create a higher-order React component class that passes props and form handlers
(the "`FormikBag`") into your component derived from supplied options.

## Example

```jsx
import React from 'react';
import { withFormik } from 'formik';

const MyForm = props => {
  const {
    values,
    touched,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
  } = props;
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={handleChange}
        onBlur={handleBlur}
        value={values.name}
        name="name"
      />
      {errors.name && touched.name && <div id="feedback">{errors.name}</div>}
      <button type="submit">Submit</button>
    </form>
  );
};

const MyEnhancedForm = withFormik({
  mapPropsToValues: () => ({ name: '' }),

  // Custom sync validation
  validate: values => {
    const errors = {};

    if (!values.name) {
      errors.name = 'Required';
    }

    return errors;
  },

  handleSubmit: (values, { setSubmitting }) => {
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2));
      setSubmitting(false);
    }, 1000);
  },

  displayName: 'BasicForm',
})(MyForm);
```

#### `options`

## Table of Contents

---

# Reference

## `options`

### `displayName?: string`

When your inner form component is a stateless functional component, you can use
the `displayName` option to give the component a proper name so you can more
easily find it in
[React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en).
If specified, your wrapped form will show up as `Formik(displayName)`. If
omitted, it will show up as `Formik(Component)`. This option is not required for
class components (e.g. `class XXXXX extends React.Component {..}`).

### `enableReinitialize?: boolean`

Default is `false`. Control whether Formik should reset the form if the wrapped
component props change (using deep equality).

### `handleSubmit: (values: Values, formikBag: FormikBag) => void`

Your form submission handler. It is passed your forms `values` and the
"FormikBag", which includes an object containing a subset of the
[injected props and methods](#injected-props-and-methods) (i.e. all the methods
with names that start with `set<Thing>` + `resetForm`) and any props that were
passed to the the wrapped component.

#### The "FormikBag":

* `props` (props passed to the wrapped component)
* `resetForm`
* `setErrors`
* `setFieldError`
* `setFieldTouched`
* `setFieldValue`
* `setStatus`
* `setSubmitting`
* `setTouched`
* `setValues`

Note: `errors`, `touched`, `status` and all event handlers are NOT
included in the `FormikBag`.

### `isInitialValid?: boolean | (props: Props) => boolean`

Default is `false`. Control the initial value of `isValid` prop prior to
mount. You can also pass a function. Useful for situations when you want to
enable/disable a submit and reset buttons on initial mount.

### `mapPropsToValues?: (props: Props) => Values`

If this option is specified, then Formik will transfer its results into
updatable form state and make these values available to the new component as
`props.values`. If `mapPropsToValues` is not specified, then Formik
will map all props that are not functions to the inner component's
`props.values`. That is, if you omit it, Formik will only pass
`props` where `typeof props[k] !== 'function'`, where `k` is some key.

Even if your form is not receiving any props from its parent, use
`mapPropsToValues` to initialize your forms empty state.

### `mapPropsToStatus?: (props: Props) => any`

If this option is specified, then Formik will transfer its results into
updatable form state and make these values available to the new component as
`props.status`. Useful for storing or instatiating arbitrary state into your form. As a reminder, `status` will be reset to this initial value (and this function will be re-run) if the form is reset.

### `validate?: (values: Values, props: Props) => FormikErrors<Values> | Promise<any>`

_Note: I suggest using `validationSchema` and Yup for validation. However,
`validate` is a dependency-free, straightforward way to validate your forms._

Validate the form's `values` with function. This function can either be:

1.  Synchronous and return an `errors` object.

```js
// Synchronous validation
const validate = (values, props) => {
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

* Asynchronous and return a Promise that's error is an `errors` object

```js
// Async Validation
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const validate = (values, props) => {
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

### `validationSchema?: Schema | ((props: Props) => Schema)`

[A Yup schema](https://github.com/jquense/yup) or a function that returns a Yup
schema. This is used for validation. Errors are mapped by key to the inner
component's `errors`. Its keys should match those of `values`.

## Injected props and methods

These are identical to the props of [`<Formik render={props => ...} />`](api/formik.md#formik-render-methods-and-props)
