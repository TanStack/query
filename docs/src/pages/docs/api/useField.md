---
id: useField
title: useField()
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/useField.md
---

`useField` is a custom React hook that will automagically help you hook up inputs to Formik. You can and should use it to build your own custom input primitives. There are 2 ways to use it.

## Example

```tsx
import React from 'react';
import { useField, Form, FormikProps, Formik } from 'formik';

interface Values {
  firstName: string;
  lastName: string;
  email: string;
}

const MyTextField = ({ label, ...props }) => {
  const [field, meta, helpers] = useField(props);
  return (
    <>
      <label>
        {label}
        <input {...field} {...props} />
      </label>
      {meta.touched && meta.error ? (
        <div className='error'>{meta.error}</div>
      ) : null}
    </>
  );
};

const Example = () => (
  <div>
    <h1>My Form</h1>
    <Formik
      initialValues={{
        email: '',
        firstName: 'red',
        lastName: '',
      }}
      onSubmit={(values, actions) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          actions.setSubmitting(false);
        }, 1000);
      }}
    >
      {(props: FormikProps<Values>) => (
        <Form>
          <MyTextField name="firstName" type="text" label="First Name" />
          <MyTextField name="lastName" type="text" label="Last Name" />
          <MyTextField name="email" type="email" label="Email" />
          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  </div>
);
```

---

# Reference

## `useField<Value = any>(name: string | FieldAttributes<Val>): [FieldInputProps<Value>, FieldMetaProps<Value>, FieldHelperProps]`

A custom React Hook that returns a 3-tuple (an array with three elements) containing `FieldProps`, `FieldMetaProps` and `FieldHelperProps`. It accepts either a string of a field name or an object as an argument. The object must at least contain a `name` key. This object should be identical to the props that you would pass to `<Field>` and the values and functions in `FieldProps` will mimic the behavior of `<Field>` exactly. This is useful, and generally preferred, since it allows you to take advantage of formik's checkbox, radio, and multiple select behavior when the object contains the relevant key/values (e.g. `type: 'checkbox'`, `multiple: true`, etc.).

`FieldMetaProps` contains computed values about the field which can be used to style or otherwise change the field. `FieldHelperProps` contains helper functions that allow you to imperatively change a field's values.

```jsx
import React from 'react';
import { useField } from 'formik';

function MyTextField(props) {
  // this will return field props for an <input />
  const [field, meta, helpers] = useField(props.name);
  return (
    <>
      <input {...field} {...props} />
      {meta.error && meta.touched && <div>{meta.error}</div>}
    </>
  );
}

function MyInput(props) {
  // this will return field exactly like <Field>{({ field }) => ... }</Field>
  const [field, meta] = useField(props);
  return (
    <>
      <input {...field} {...props} />
      {meta.error && meta.touched && <div>{meta.error}</div>}
    </>
  );
}

function MyOtherComponent(props) {
  // This isn't an input, so instead of using the values in 'field' directly,
  // we'll use 'meta' and 'helpers'.
  const [field, meta, helpers] = useField(props.name);

  const { value } = meta;
  const { setValue } = helpers;

  const isSelected = v => (v === value ? 'selected' : '');

  return (
    <div className='itemsPerPage'>
      <button onClick={() => setValue(5)} className={isSelected(5)}>
        5
      </button>
      <button onClick={() => setValue(10)} className={isSelected(10)}>
        10
      </button>
      <button onClick={() => setValue(25)} className={isSelected(25)}>
        25
      </button>
    </div>
  );
}
```

### `FieldInputProps<Value>`

An object that contains:

- `name: string` - The name of the field
- `checked?: boolean` - Whether or not the input is checked, this is _only_ defined if `useField` is passed an object with a `name`, `type: 'checkbox'` or `type: radio`.
- `onBlur: () => void;` - A blur event handler
- `onChange: (e: React.ChangeEvent<any>) => void` - A change event handler
- `value: Value` - The field's value (plucked out of `values`) or, if it is a checkbox or radio input, then potentially the `value` passed into `useField`.
- `multiple?: boolean` - Whether or not the multiple values can be selected. This is only ever defined when `useField` is passed an object with `multiple: true`

### `FieldMetaProps<Value>`

An object that contains relevant computed metadata about a field. More specifically,

- `error?: string` - The field's error message (plucked out of `errors`)
- `initialError?: string` - The field's initial error if the field is present in `initialErrors` (plucked out of `initialErrors`)
- `initialTouched: boolean` - The field's initial value if the field is present in `initialTouched` (plucked out of `initialTouched`)
- `initialValue?: Value` - The field's initial value if the field is given a value in `initialValues` (plucked out of `initialValues`)
- `touched: boolean` - Whether the field has been visited (plucked out of `touched`)
- `value: any` - The field's value (plucked out of `values`)

### `FieldHelperProps`

An object that contains helper functions which you can use to imperatively change the value, error value or touched status for the field in question. This is useful for components which need to change a field's status directly, without triggering change or blur events.

- `setValue(value: any, shouldValidate?: boolean): void` - A function to change the field's value.  Calling this will trigger validation to run if `validateOnChange` is set to `true` (which it is by default). You can also explicitly prevent/skip validation by passing a second argument as `false`.
- `setTouched(value: boolean, shouldValidate?: boolean): void` - A function to change the field's touched status. Calling this will trigger validation to run if `validateOnBlur` is set to `true` (which it is by default). You can also explicitly prevent/skip validation by passing a second argument as `false`.
- `setError(value: any): void` - A function to change the field's error value
