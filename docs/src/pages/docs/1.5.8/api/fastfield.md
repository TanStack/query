---
id: fastfield
title: <FastField />
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/fastfield.md
---

## Before we start

`<FastField />` is meant for performance _optimization_. However, you really do not need to use it until you do. Only proceed if you are familiar with how React's [`shouldComponentUpdate()`](https://reactjs.org/docs/react-component.html#shouldcomponentupdate) works. You have been warned.

**No. Seriously. Please review the following parts of the official React documentation before continuing**

* [React `shouldComponentUpdate()` Reference](https://reactjs.org/docs/react-component.html#shouldcomponentupdate)
* [`shouldComponentUpdate` in Action](https://reactjs.org/docs/optimizing-performance.html#shouldcomponentupdate-in-action)

## Overview

`<FastField />` is an optimized version of `<Field />` meant to be used on large forms (~30+ fields) or when a field has very expensive validation requirements. `<FastField />` has the same exact API as `<Field>`, but implements `shouldComponentUpdate()` internally to block all additional re-renders unless there are direct updates to the `<FastField />`'s relevant parts/slice of Formik state.

For example, `<FastField name="firstName" />` will only re-render when there are:

* Changes to `values.firstName`, `errors.firstName`, `touched.firstName`, or `isSubmitting`. This is determined by shallow comparison. Note: dotpaths are supported.
* A prop is added/removed to the `<FastField name="firstName" />`
* The `name` prop changes

Other than for these aforementioned situations, `<FastField />` will not re-render when other parts of of Formik state change. However, all updates triggered by a `<FastField />` will trigger re-renders to other "vanilla" `<Field />` components.

## When to use `<FastField />`

**If a `<Field />` is "independent" of all other `<Field />`'s in your form, then you can use `<FastField />`**.

More specifically, if the `<Field />` does not change behavior or render anything that is based on updates to another `<Field />` or `<FastField />`'s slice of Formik state AND it does not rely on other parts of top-level `<Formik />` state (e.g. `isValidating`, `submitCount`), then you can use `<FastField />` as a drop-in replacement to `<Field />`.

## Example

```jsx
import React from 'react';
import { Formik, Field, FastField, Form } from 'formik';

const Basic = () => (
  <div>
    <h1>Sign Up</h1>
    <Formik
      initialValues={{
        firstName: '',
        lastName: '',
        email: '',
      }}
      validationSchema={Yup.object().shape({
        firstName: Yup.string().required(),
        middleInitial: Yup.string(),
        lastName: Yup.string().required(),
        email: Yup.string()
          .email()
          .required(),
      })}
      onSubmit={values => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
        }, 500);
      }}
      render={formikProps => (
        <Form>
          {/** This <FastField> only updates for changes made to
           values.firstName, touched.firstName, errors.firstName */}
          <label htmlFor="firstName">First Name</label>
          <FastField name="firstName" placeholder="Weezy" />

          {/** Updates for all changes because it's from the
           top-level formikProps which get all updates */}
          {form.touched.firstName &&
            form.errors.firstName && <div>{form.errors.firstName}</div>}

          <label htmlFor="middleInitial">Middle Initial</label>
          <FastField
            name="middleInitial"
            placeholder="F"
            render={({ field, form }) => (
              <div>
                <input {...field} />
                {/**
                 * This updates normally because it's from the same slice of Formik state,
                 * i.e. path to the object matches the name of this <FastField />
                 */}
                {form.touched.middleInitial ? form.errors.middleInitial : null}

                {/** This won't ever update since it's coming from
                 from another <Field>/<FastField>'s (i.e. firstName's) slice   */}
                {form.touched.firstName && form.errors.firstName
                  ? form.errors.firstName
                  : null}

                {/* This doesn't update either */}
                {form.submitCount}

                {/* Imperative methods still work as expected */}
                <button
                  type="button"
                  onClick={form.setFieldValue('middleInitial', 'J')}
                >
                  J
                </button>
              </div>
            )}
          />

          {/** Updates for all changes to Formik state
           and all changes by all <Field>s and <FastField>s */}
          <label htmlFor="lastName">LastName</label>
          <Field
            name="lastName"
            placeholder="Baby"
            render={({ field, form }) => (
              <div>
                <input {...field} />
                {/** Works because this is inside
                 of a <Field/>, which gets all updates */}
                {form.touched.firstName && form.errors.firstName
                  ? form.errors.firstName
                  : null}
              </div>
            )}
          />

          {/** Updates for all changes to Formik state and
           all changes by all <Field>s and <FastField>s */}
          <label htmlFor="email">Email</label>
          <Field name="email" placeholder="jane@acme.com" type="email" />

          <button type="submit">Submit</button>
        </Form>
      )}
    />
  </div>
);
```
