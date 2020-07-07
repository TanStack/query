---
id: tutorial
title: Tutorial
---

## Learn Formik by Building it.

My talk at React Alicante is really the best way to get started. It introduces the library (by watching me build a mini version of it) and demos how to build a non-trivial form (with arrays, custom inputs, etc.) using the real thing. It's around 45 minutes long.

<iframe width="800" height="315" src="https://www.youtube.com/embed/oiNtnehlaTo" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen title="Taming Forms in React - Jared Palmer"></iframe>

## Basics

_If you just want to jump into some code, here's a quick walkthrough of the basics..._

Imagine you want to build a form that lets you edit user data. However, your
user API has nested objects like so.

```js
{
   id: string,
   email: string,
   social: {
     facebook: string,
     twitter: string,
     // ...
   }
}
```

```jsx
// EditUserDialog.js
import React from 'react';
import Dialog from 'MyImaginaryDialogComponent'; // this isn't a real package, just imagine it exists.
import { Formik } from 'formik';

const EditUserDialog = ({ user, updateUser, onClose }) => {
  return (
    <Dialog onClose={onClose}>
      <h1>Edit User</h1>
      <Formik
        initialValues={user /** { email, social } */}
        onSubmit={(values, actions) => {
          MyImaginaryRestApiCall(user.id, values).then(
            updatedUser => {
              actions.setSubmitting(false);
              updateUser(updatedUser);
              onClose();
            },
            error => {
              actions.setSubmitting(false);
              actions.setErrors(transformMyRestApiErrorsToAnObject(error));
              actions.setStatus({ msg: 'Set some arbitrary status or data' });
            }
          );
        }}
        render={({
          values,
          errors,
          status,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.email}
            />
            {errors.email && touched.email && <div>{errors.email}</div>}
            <input
              type="text"
              name="social.facebook"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.social.facebook}
            />
            {errors.social &&
              errors.social.facebook &&
              touched.facebook && <div>{errors.social.facebook}</div>}
            <input
              type="text"
              name="social.twitter"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.social.twitter}
            />
            {errors.social &&
              errors.social.twitter &&
              touched.twitter && <div>{errors.social.twitter}</div>}
            {status && status.msg && <div>{status.msg}</div>}
            <button type="submit" disabled={isSubmitting}>
              Submit
            </button>
          </form>
        )}
      />
    </Dialog>
  );
};
```

To make writing forms less verbose. Formik comes with a few helpers to save you
key strokes.

* `<Field>`
* `<Form />`

This is the **exact** same form as before, but written with `<Form />` and
`<Field />`:

```jsx
// EditUserDialog.js
import React from 'react';
import Dialog from 'MySuperDialog';
import { Formik, Field, Form } from 'formik';

const EditUserDialog = ({ user, updateUser, onClose }) => {
  return (
    <Dialog onClose={onClose}>
      <h1>Edit User</h1>
      <Formik
        initialValues={user /** { email, social } */}
        onSubmit={(values, actions) => {
          MyImaginaryRestApiCall(user.id, values).then(
            updatedUser => {
              actions.setSubmitting(false);
              updateUser(updatedUser);
              onClose();
            },
            error => {
              actions.setSubmitting(false);
              actions.setErrors(transformMyRestApiErrorsToAnObject(error));
              actions.setStatus({ msg: 'Set some arbitrary status or data' });
            }
          );
        }}
        render={({ errors, status, touched, isSubmitting }) => (
          <Form>
            <Field type="email" name="email" />
            {errors.email && touched.email && <div>{errors.email}</div>}
            <Field type="text" name="social.facebook" />
            {errors.social && errors.social.facebook &&
              touched.social.facebook && <div>{errors.social.facebook}</div>}
            <Field type="text" name="social.twitter" />
            {errors.social && errors.social.twitter &&
              touched.social.twitter && <div>{errors.social.twitter}</div>}
            {status && status.msg && <div>{status.msg}</div>}
            <button type="submit" disabled={isSubmitting}>
              Submit
            </button>
          </Form>
        )}
      />
    </Dialog>
  );
};
```

This is better, but that all those `errors` and `touched` logic is still quite repetitive. Formik has a component just for this called `<ErrorMessage>` which can simplify things even more. It accepts a render prop or a component prop for maximum flexibility.

```jsx
// EditUserDialog.js
import React from 'react';
import Dialog from 'MySuperDialog';
import { Formik, Field, Form, ErrorMessage } from 'formik';

const EditUserDialog = ({ user, updateUser, onClose }) => {
  return (
    <Dialog onClose={onClose}>
      <h1>Edit User</h1>
      <Formik
        initialValues={user /** { email, social } */}
        onSubmit={(values, actions) => {
          MyImaginaryRestApiCall(user.id, values).then(
            updatedUser => {
              actions.setSubmitting(false);
              updateUser(updatedUser);
              onClose();
            },
            error => {
              actions.setSubmitting(false);
              actions.setErrors(transformMyRestApiErrorsToAnObject(error));
              actions.setStatus({ msg: 'Set some arbitrary status or data' });
            }
          );
        }}
        render={({ errors, status, touched, isSubmitting }) => (
          <Form>
            <Field type="email" name="email" />
            <ErrorMessage name="email" component="div" />  
            <Field type="text" className="error" name="social.facebook" />
            <ErrorMessage name="social.facebook">
              {errorMessage => <div className="error">{errorMessage}</div>}
            </ErrorMessage>
            <Field type="text" name="social.twitter" />
            <ErrorMessage name="social.twitter" className="error" component="div"/>  
            {status && status.msg && <div>{status.msg}</div>}
            <button type="submit" disabled={isSubmitting}>
              Submit
            </button>
          </Form>
        )}
      />
    </Dialog>
  );
};
```
