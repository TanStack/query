---
id: validation
title: Validation
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/guides/validation.md
---

Formik is designed to manage forms with complex validation with ease. Formik supports synchronous and asynchronous
form-level and field-level validation. Furthermore, it comes with baked-in support for schema-based form-level validation through Yup. This guide will describe the ins and outs of all of the above.

## Table of Contents

## Flavors of Validation

### Form-level Validation

Form-level validation is useful because you have complete access to all of your form's `values` and props whenever the function runs, so you can validate dependent fields at the same time.

There are 2 ways to do form-level validation with Formik:

* `<Formik validate>` and `withFormik({ validate: ... })`
* `<Formik validationSchema>` and `withFormik({ validationSchema: ... })`

#### `validate`

`<Formik>` and `withFormik()` take prop/option called `validate` that accepts either a synchronous or asynchronous function.

```js
// Synchronous validation
const validate = (values, props /* only available when using withFormik */) => {
  let errors = {};

  if (!values.email) {
    errors.email = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }

  //...

  return errors;
};

// Async Validation
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const validate = (values, props /* only available when using withFormik */) => {
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

For more information about `<Formik validate>`, see the API reference.

#### `validationSchema`

As you can see above, validation is left up to you. Feel free to write your own
validators or use a 3rd party library. At The Palmer Group, we use
[Yup](https://github.com/jquense/yup) for object schema validation. It has an
API that's pretty similar to [Joi](https://github.com/hapijs/joi) and
[React PropTypes](https://github.com/facebook/prop-types) but is small enough
for the browser and fast enough for runtime usage. Because we ❤️ Yup sooo
much, Formik has a special config option / prop for Yup object schemas called `validationSchema` which will automatically transform Yup's validation errors into a pretty object whose keys match `values` and `touched`. This symmetry makes it easy to manage business logic around error messages.

To add Yup to your project, install it from NPM.

```sh
npm install yup --save
# typescript users should add the @types/yup
```

```jsx
import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const SignupSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'Too Short!')
    .max(50, 'Too Long!')
    .required('Required'),
  lastName: Yup.string()
    .min(2, 'Too Short!')
    .max(50, 'Too Long!')
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
        firstName: '',
        lastName: '',
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
          <Field name="firstName" />
          {errors.firstName && touched.firstName ? (
            <div>{errors.firstName}</div>
          ) : null}
          <Field name="lastName" />
          {errors.lastName && touched.lastName ? (
            <div>{errors.lastName}</div>
          ) : null}
          <Field name="email" type="email" />
          {errors.email && touched.email ? <div>{errors.email}</div> : null}
          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  </div>
);
```

For more information about `<Formik validationSchema>`, see the API reference.

### Field-level Validation

#### `validate`

Formik supports field-level validation via the `<Field>`/`<FastField>` components' `validate` prop. This function can be synchronous or asynchronous (return a Promise). It will run after any `onChange` and `onBlur` by default. This behavior can be altered at the top level `<Formik/>` component using the `validateOnChange` and `validateOnBlur` props respectively. In addition to change/blur, all field-level validations are run at the beginning of a submission attempt and then the results are deeply merged with any top-level validation results.

> Note: The `<Field>/<FastField>` components' `validate` function will only be executed on mounted fields. That is to say, if any of your fields unmount during the flow of your form (e.g. Material-UI's `<Tabs>` unmounts the previous `<Tab>` your user was on), those fields will not be validated during form validation/submission.

```jsx
import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

function validateEmail(value) {
  let error;
  if (!value) {
    error = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
    error = 'Invalid email address';
  }
  return error;
}

function validateUsername(value) {
  let error;
  if (value === 'admin') {
    error = 'Nice try!';
  }
  return error;
}

export const FieldLevelValidationExample = () => (
  <div>
    <h1>Signup</h1>
    <Formik
      initialValues={{
        username: '',
        email: '',
      }}
      onSubmit={values => {
        // same shape as initial values
        console.log(values);
      }}
    >
      {({ errors, touched, isValidating }) => (
        <Form>
          <Field name="email" validate={validateEmail} />
          {errors.email && touched.email && <div>{errors.email}</div>}

          <Field name="username" validate={validateUsername} />
          {errors.username && touched.username && <div>{errors.username}</div>}

          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  </div>
);
```

### Manually Triggering Validation

You can manually trigger both form-level and field-level validation with Formik using the `validateForm` and `validateField` methods respectively.

```jsx
import React from 'react';
import { Formik, Form, Field } from 'formik';

function validateEmail(value) {
  let error;
  if (!value) {
    error = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
    error = 'Invalid email address';
  }
  return error;
}

function validateUsername(value) {
  let error;
  if (value === 'admin') {
    error = 'Nice try!';
  }
  return error;
}

export const FieldLevelValidationExample = () => (
  <div>
    <h1>Signup</h1>
    <Formik
      initialValues={{
        username: '',
        email: '',
      }}
      onSubmit={values => {
        // same shape as initial values
        console.log(values);
      }}
    >
      {({ errors, touched, validateField, validateForm }) => (
        <Form>
          <Field name="email" validate={validateEmail} />
          {errors.email && touched.email && <div>{errors.email}</div>}

          <Field name="username" validate={validateUsername} />
          {errors.username && touched.username && <div>{errors.username}</div>}
          {/** Trigger field-level validation
           imperatively */}
          <button type="button" onClick={() => validateField('username')}>
            Check Username
          </button>
          {/** Trigger form-level validation
           imperatively */}
          <button type="button" onClick={() => validateForm().then(() => console.log('blah')))}>
            Validate All
          </button>
          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  </div>
);
```

## When Does Validation Run?

You can control when Formik runs validation by changing the values of `<Formik validateOnChange>` and/or `<Formik validateOnBlur>` props depending on your needs. By default, Formik will run validation methods as follows:

**After "change" events/methods** (things that update`values`)

* `handleChange`
* `setFieldValue`
* `setValues`

**After "blur" events/methods** (things that update `touched`)

* `handleBlur`
* `setTouched`
* `setFieldTouched`

**Whenever submission is attempted**

* `handleSubmit`
* `submitForm`

There are also imperative helper methods provided to you via Formik's render/injected props which you can use to imperatively call validation.

* `validateForm`
* `validateField`

## Displaying Error Messages

@todo

## Frequently Asked Questions

<details>
<summary>How do I determine if my form is validating?</summary>

If `isValidating` prop is `true`

</details>

<details>
<summary>Can I return `null` as an error message?</summary>

No. Use `undefined` instead. Formik uses `undefined` to represent empty states. If you use `null`, several parts of Formik's computed props (e.g. `isValid` for example), will not work as expected.

</details>

<details>
<summary>How do I test validation?</summary>

Formik has extensive unit tests for Yup validation so you do not need to test that. However, if you are rolling your own validation functions, you should simply unit test those. If you do need to test Formik's execution you should use the imperative `validateForm` and `validateField` methods respectively.

</details>
