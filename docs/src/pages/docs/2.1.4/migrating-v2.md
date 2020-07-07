---
id: migrating-v2
title: Migrating from v1.x to v2.x
---

## Breaking Changes

### Minimum Requirements

- Since Formik 2 is built on top of React Hooks, you must be on React 16.8.x or higher
- Since Formik 2 uses the `unknown` type, you must be on TypeScript 3.0 or higher (if you use TypeScript)

**There are a few breaking changes in Formik 2.x.** Luckily, these probably won't impact many people:

### `resetForm`

Because we introduced `initialErrors`, `initialTouched`, `initialStatus` props, `resetForm`'s signature has changed. It now accepts the next initial state of Formik (instead of just the next initial values).

### `setError`

Please use Formik's `setStatus(status)` instead. It works identically.

### `validate`

As you may know, you can return a Promise of a validation error from `validate`. In 1.x, it didn't matter if this promise is resolved or rejected as in both cases the payload of the promise was interpreted as the validation error. In 2.x, rejection will be interpreted as an actual exception and it won't update the form error state. Any validation function that returns a rejected promise of errors needs to be adjusted to return a resolved promise of errors instead.

### `ref`

Currently, you can't attach a ref to Formik using the `ref` prop. However, you still can get around this issue using the prop `innerRef`. We have some WIP [#2208](https://github.com/jaredpalmer/formik/issues/2208) to instead use `React.forwardRef`.

**v1**

```tsx
resetForm(nextValues);
```

**v2**

```tsx
resetForm({ values: nextValues /* errors, touched, etc ... */ });
```

### Typescript changes

#### `FormikActions`

**`FormikActions` has been renamed to `FormikHelpers`** It should be a straightforward change to import or alias the type

**v1**

```tsx
import { FormikActions } from 'formik';
```

**v2**

```tsx
import { FormikHelpers as FormikActions } from 'formik';
```

#### `FieldProps`

**`FieldProps` now accepts two generic type parameters.** Both parameters are optional, but `FormValues` has been moved from the first to the second parameter.

**v1**

```tsx
type Props = FieldProps<FormValues>;
```

**v2**

```tsx
type Props = FieldProps<FieldValue, FormValues>;
```

## What's New?

### Checkboxes and Select multiple

Similarly to Angular, Vue, or Svelte, Formik 2 "fixes" React checkboxes and multi-selects with built-in array binding and boolean behavior. This was one of the most confusing things for people in Formik 1.x.

```jsx
import React from 'react';
import { Formik, Field, Form } from 'formik';
import { Debug } from './Debug';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const CheckboxExample = () => (
  <div>
    <h1>Checkboxes</h1>
    <p>
      This example demonstrates how to properly create checkboxes with Formik.
    </p>
    <Formik
      initialValues={{
        isAwesome: false,
        terms: false,
        newsletter: false,
        jobType: ['designer'],
        location: [],
      }}
      onSubmit={async values => {
        await sleep(1000);
        alert(JSON.stringify(values, null, 2));
      }}
    >
      {({ isSubmitting, getFieldProps, handleChange, handleBlur, values }) => (
        <Form>
          {/* 
            This first checkbox will result in a boolean value being stored.
          */}
          <div className="label">Basic Info</div>
          <label>
            <Field type="checkbox" name="isAwesome" />
            Are you awesome?
          </label>
          {/* 
            Multiple checkboxes with the same name attribute, but different
            value attributes will be considered a "checkbox group". Formik will automagically
            bind the checked values to a single array for your benefit. All the add and remove
            logic will be taken care of for you.
          */}
          <div className="label">
            What best describes you? (check all that apply)
          </div>
          <label>
            <Field type="checkbox" name="jobType" value="designer" />
            Designer
          </label>
          <label>
            <Field type="checkbox" name="jobType" value="developer" />
            Developer
          </label>
          <label>
            <Field type="checkbox" name="jobType" value="product" />
            Product Manager
          </label>
          {/*
           You do not _need_ to use <Field>/useField to get this behavior, 
           using handleChange, handleBlur, and values works as well. 
          */}
          <label>
            <input
              type="checkbox"
              name="jobType"
              value="founder"
              checked={values.jobType.includes('founder')}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            CEO / Founder
          </label>

          {/* 
           The <select> element will also behave the same way if 
           you pass `multiple` prop to it. 
          */}
          <label htmlFor="location">Where do you work?</label>
          <Field
            component="select"
            id="location"
            name="location"
            multiple={true}
          >
            <option value="NY">New York</option>
            <option value="SF">San Francisco</option>
            <option value="CH">Chicago</option>
            <option value="OTHER">Other</option>
          </Field>
          <label>
            <Field type="checkbox" name="terms" />I accept the terms and
            conditions.
          </label>
          {/* Here's how you can use a checkbox to show / hide another field */}
          {!!values.terms ? (
            <div>
              <label>
                <Field type="checkbox" name="newsletter" />
                Send me the newsletter <em style={{ color: 'rebeccapurple' }}>
                  (This is only shown if terms = true)
                </em>
              </label>
            </div>
          ) : null}
          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
          <Debug />
        </Form>
      )}
    </Formik>
  </div>
);

export default CheckboxExample;
```

### `useField()`

Just what you think, it's like `<Field>`, but with a hook. See docs for usage.

### `useFormikContext()`

A hook that is equivalent to `connect()`.

### `<Field as>`

`<Field/>` now accepts a prop called `as` which will inject `onChange`, `onBlur`, `value` etc. directly through to the component or string. This is useful for folks using Emotion or Styled components as they no longer need to clean up `component`'s render props in a wrapped function.

### Misc

- `FormikContext` is now exported
- `validateOnMount?: boolean = false`
- `initialErrors`, `initialTouched`, `initialStatus` have been added

```jsx
// <input className="form-input" placeholder="Jane"  />
<Field name="firstName" className="form-input" placeholder="Jane" />

// <textarea className="form-textarea"/></textarea>
<Field name="message" as="textarea"  className="form-textarea"/>

// <select className="my-select"/>
<Field name="colors" as="select" className="my-select">
  <option value="red">Red</option>
  <option value="green">Green</option>
  <option value="blue">Blue</option>
</Field>

// with styled-components/emotion
const MyStyledInput = styled.input`
  padding: .5em;
  border: 1px solid #eee;
  /* ... */
`
const MyStyledTextarea = MyStyledInput.withComponent('textarea');

// <input className="czx_123" placeholder="google.com"  />
<Field name="website" as={MyStyledInput} placeholder="google.com"/>

// <textarea placeholder="Post a message..." rows={5}></textarea>
<Field name="message" as={MyStyledTextArea} placeholder="Post a message.." rows={4}/>
```

### `getFieldProps(nameOrProps)`

There are two useful additions to `FormikProps`, `getFieldProps` and `getFieldMeta`. These are Kent C. Dodds-esque prop getters that can be useful if you love prop drilling, are _not_ using the context-based API's, or if you are building a custom `useField`.

```tsx
export interface FieldInputProps<Value> {
  /** Value of the field */
  value: Value;
  /** Name of the field */
  name: string;
  /** Multiple select? */
  multiple?: boolean;
  /** Is the field checked? */
  checked?: boolean;
  /** Change event handler */
  onChange: FormikHandlers['handleChange'];
  /** Blur event handler */
  onBlur: FormikHandlers['handleBlur'];
}
```

### `getFieldMeta(name)`

Given a name it will return an object:

```tsx
export interface FieldMetaProps<Value> {
  /** Value of the field */
  value: Value;
  /** Error message of the field */
  error?: string;
  /** Has the field been visited? */
  touched: boolean;
  /** Initial value of the field */
  initialValue?: Value;
  /** Initial touched state of the field */
  initialTouched: boolean;
  /** Initial error message of the field */
  initialError?: string;
}
```

## Deprecation Warnings

### All `render` props have been deprecated with a console warning.

For `<Field>`, `<FastField>`, `<Formik>`,`<FieldArray>`, the `render` prop has been deprecated with a warning as it will be removed in future versions. Instead, use a child callback function. This deprecation is meant to parallel React Context Consumer's usage.

```diff
- <Field name="firstName" render={props => ....} />
+ <Field name="firstName">{props => ... }</Field>
```
