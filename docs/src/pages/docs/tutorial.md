---
id: tutorial
title: Tutorial
---

## Before we start

Welcome to the Formik tutorial. This will teach you everything you need to know to build simple and complex forms in React.

If you're impatient and just want to start hacking on your machine locally, checkout [the 60-second quickstart](/docs/overview#installation).

### What are we building?

In this tutorial, we'll show how to build a complex newsletter signup form with React and Formik.

You can see what we'll be building here: [Final Result](https://codesandbox.io/s/formik-v2-tutorial-final-ge1pt). If the code doesn't make sense to you, don't worry! The goal of this tutorial is to help you understand Formik.

### Prerequisites

You'll need to have familiarity with HTML, CSS, [modern JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/A_re-introduction_to_JavaScript), and [React](https://reactjs.org) (and [React Hooks](https://reactjs.org/docs/hooks-intro.html)) to fully understand Formik and how it works. In this tutorial, we're using [arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions), [let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let), [const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const), [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax), [destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment), [computed property names](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names), and [async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) . You can use the [Babel REPL](https://babeljs.io/repl/#?presets=react&code_lz=MYewdgzgLgBApgGzgWzmWBeGAeAFgRgD4AJRBEAGhgHcQAnBAEwEJsB6AwgbgChRJY_KAEMAlmDh0YWRiGABXVOgB0AczhQAokiVQAQgE8AkowAUAcjogQUcwEpeAJTjDgUACIB5ALLK6aRklTRBQ0KCohMQk6Bx4gA) to check what ES6 code compiles to.

## Setup for the Tutorial

There are two ways to complete this tutorial: you can either write the code in your browser, or you can set up a local development environment on your computer.

### Setup Option 1: Write Code in the Browser

This is the quickest way to get started!

First, open this [Starter Code](https://codesandbox.io/s/formik-v2-tutorial-start-s04yr) in a new tab. The new tab should display an email address input and submit button and some React code. We will be editing the React code in this tutorial.

You can now skip the second setup option, and go to the [Overview](#overview-what-is-formik) section to get an overview of Formik.

### Setup Option 2: Local Development Environment

This is completely optional and not required for this tutorial!

<details>

<summary><b>Optional: Instructions for following along locally using your preferred text editor</b></summary>

This setup requires more work but allows you to complete the tutorial using an editor of your choice. Here are the steps to follow:

1. Make sure you have a recent version of [Node.js](https://nodejs.org/en/) installed.
2. Follow the [installation instructions for Create React App](https://create-react-app.dev) to make a new project.

```bash
npx create-react-app my-app
```

3. Delete all files in the `src/` folder of the new project

> Note:
>
> **Don't delete the entire `src` folder, just the original source files inside it.** We'll replace the default source files with examples for this project in the next step.

```bash
cd my-app
cd src

# If you're using a Mac or Linux:
rm -f *

# Or, if you're on Windows:
del *

# Then, switch back to the project folder
cd ..
```

4. Add a file named `styles.css` in the `src/` folder with [this CSS code](https://codesandbox.io/s/formik-v2-tutorial-start-s04yr?file=/src/styles.css).

5. Add a file named `index.js` in the `src/` folder with [this JS code](https://codesandbox.io/s/formik-v2-tutorial-start-s04yr?file=/src/index.js:0-759).

Now if you run `npm start` in the project folder and open `http://localhost:3000` in the browser. You should see an email input and a submit button.

We recommend following [these instructions](https://babeljs.io/docs/editors/) to configure syntax highlighting for your editor.

</details>

### Help, I’m Stuck!

If you get stuck, check out the [community support resources](https://jaredpalmer.com/formik/help). In particular, [Reactiflux Chat](https://discord.gg/cU6MCve) is a great way to get help quickly. If you don’t receive an answer, or if you remain stuck, please file an issue, and we’ll help you out.

## Overview: What is Formik?

Formik is a small group of React components and hooks for building forms in React and React Native. It helps with the three most annoying parts:

1.  Getting values in and out of form state
2.  Validation and error messages
3.  Handling form submission

By colocating all of the above in one place, Formik keeps things
organized--making testing, refactoring, and reasoning about your forms a breeze.

## The Basics

We're going to start with the _most verbose_ way of using Formik. While this may seem a bit long-winded, it's important for you to see how Formik builds on itself so you have a full grasp of what's possible and a complete mental model of how it works.

### A simple newsletter signup form

Imagine we want to add a newsletter signup form for a hypothetical blog. To start, our form will have just one field named `email`. With Formik, this is just a few lines of code.

```jsx
import React from 'react';
import { useFormik } from 'formik';

const SignupForm = () => {
  // Pass the useFormik() hook initial form values and a submit function that will
  // be called when the form is submitted
  const formik = useFormik({
    initialValues: {
      email: '',
    },
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        value={formik.values.email}
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

We pass our form's `initialValues` and a submission function (`onSubmit`) to the `useFormik()` hook. The hook then returns to us a goodie bag of form state and helpers in a variable we are calling `formik`. In the goodie bag, there are a bunch of helper methods, but for now, the ones we care about are as follows:

- `handleSubmit`: A submission handler
- `handleChange`: A change handler to pass to each `<input>`, `<select>`, or `<textarea>`
- `values`: Our form's current values

As you can see above, we pass each of these up to their respective props...and that's it! You can now have a working form powered by Formik--instead of managing your form's values on your own and writing your own custom event handlers for every single input, you can just use `useFormik()`.

This is pretty neat, but with just one single input, the benefits of using `useFormik()` are unclear. So let's add two more inputs: one for the user's first and last name, which we'll store as `firstName` and `lastName` in the form.

```jsx
import React from 'react';
import { useFormik } from 'formik';

const SignupForm = () => {
  // Notice that we have to initialize ALL of fields with values. These
  // could come from props, but since we don't want to prefill this form,
  // we just use an empty string. If you don't do this, React will yell
  // at you.
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="firstName">First Name</label>
      <input
        id="firstName"
        name="firstName"
        type="text"
        onChange={formik.handleChange}
        value={formik.values.firstName}
      />
      <label htmlFor="lastName">Last Name</label>
      <input
        id="lastName"
        name="lastName"
        type="text"
        onChange={formik.handleChange}
        value={formik.values.lastName}
      />
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        value={formik.values.email}
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

If you look carefully at our new code, you'll notice some patterns and symmetry _forming_.

1. We reuse the same exact change handler function `handleChange` for each HTML input.
2. We pass an `id` and `name` HTML attribute that _matches_ the property we defined in `initialValues`
3. We access the field's value using the same name (`email` -> `formik.values.email`).

If you're familiar with building forms with plain React, you can think of Formik's `handleChange` as working like this:

```jsx
const [values, setValues] = React.useState({});

const handleChange = event => {
  setValues(prevValues => ({
    ...prevValues,
    // we use the name to tell formik which key of `values` to update.
    [event.target.name]: event.target.value
  });
}
```

## Validation

While our contact form works, it's not quite feature-complete. While users can submit it, it doesn't tell them which (if any) fields are required.

If we are okay with using the browser's built-in HTML input validation, you could add a `required` prop to each of our inputs, specify minimum/maximum lengths (`maxlength` and `minlength`), and/or add a `pattern` prop for regex validation for each of these inputs. These are great if you can get away with them. However, HTML validation has its limitations. First, it only works in the browser! So this clearly is not viable for React Native. Second, it's hard/impossible to show custom error messages to our user. Third, it's very janky.

As mentioned earlier, Formik keeps track of not only your form's `values`, but also its error messages and validation. To add validation with JS, let's specify a custom validation function and pass it as `validate` to the `useFormik()` hook. If an error exists, this custom validation function should produce an `error` object with a matching shape to our `values`/`initialValues`. Again..._symmetry_...yes...

```jsx
import React from 'react';
import { useFormik } from 'formik';

// A custom validation function. This must return an object
// which keys are symmetrical to our values/initialValues
const validate = values => {
  const errors = {};
  if (!values.firstName) {
    errors.firstName = 'Required';
  } else if (values.firstName.length > 15) {
    errors.firstName = 'Must be 15 characters or less';
  }

  if (!values.lastName) {
    errors.lastName = 'Required';
  } else if (values.lastName.length > 20) {
    errors.lastName = 'Must be 20 characters or less';
  }

  if (!values.email) {
    errors.email = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }

  return errors;
};

const SignupForm = () => {
  // Pass the useFormik() hook initial form values and a submit function that will
  // be called when the form is submitted
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    validate,
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="firstName">First Name</label>
      <input
        id="firstName"
        name="firstName"
        type="text"
        onChange={formik.handleChange}
        value={formik.values.firstName}
      />
      {formik.errors.firstName ? <div>{formik.errors.firstName}</div> : null}
      <label htmlFor="lastName">Last Name</label>
      <input
        id="lastName"
        name="lastName"
        type="text"
        onChange={formik.handleChange}
        value={formik.values.lastName}
      />
      {formik.errors.lastName ? <div>{formik.errors.lastName}</div> : null}
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        value={formik.values.email}
      />
      {formik.errors.email ? <div>{formik.errors.email}</div> : null}
      <button type="submit">Submit</button>
    </form>
  );
};
```

`formik.errors` is populated via the custom validation function. By default, Formik will validate after each keystroke (change event), each input's blur event, as well as prior to submission. It will only proceed with executing the `onSubmit` function we passed to `useFormik()` if there are no errors (i.e. if our validation function returned `{}`).

## Visited fields

While our form works, and our users see each error, it's not a great user experience for them. Since our validation function runs on each keystroke against the _entire_ form's `values`, our `errors` object contains _all_ validation errors at any given moment. In our component, we are just checking if an error exists and then immediately showing it to the user. This is awkward since we're going to show error messages for fields that the user hasn't even visited yet. Most of the time, we only want to show a field's error message _after_ our user is done typing in that field.

Like `errors` and `values`, Formik can keep track of which fields have been visited. It stores this information in an object called `touched` that also mirrors the shape of `values`/`initialValues`, but each key can only be a boolean `true`/`false`.

To take advantage of `touched`, we can pass `formik.handleBlur` to each input's `onBlur` prop. This function works similarly to `formik.handleChange` in that it uses the `name` attribute to figure out which field to update.

```jsx
import React from 'react';
import { useFormik } from 'formik';

const validate = values => {
  const errors = {};
  if (!values.firstName) {
    errors.firstName = 'Required';
  } else if (values.firstName.length > 15) {
    errors.firstName = 'Must be 15 characters or less';
  }

  if (!values.lastName) {
    errors.lastName = 'Required';
  } else if (values.lastName.length > 20) {
    errors.lastName = 'Must be 20 characters or less';
  }

  if (!values.email) {
    errors.email = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }

  return errors;
};

const SignupForm = () => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    validate,
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="firstName">First Name</label>
      <input
        id="firstName"
        name="firstName"
        type="text"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.firstName}
      />
      {formik.errors.firstName ? <div>{formik.errors.firstName}</div> : null}
      <label htmlFor="lastName">Last Name</label>
      <input
        id="lastName"
        name="lastName"
        type="text"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.lastName}
      />
      {formik.errors.lastName ? <div>{formik.errors.lastName}</div> : null}
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.email}
      />
      {formik.errors.email ? <div>{formik.errors.email}</div> : null}
      <button type="submit">Submit</button>
    </form>
  );
};
```

Almost there! Now that we're tracking `touched`, we can now change our error message render logic to _only_ show a field's error message if it exists _and_ if our user has visited a given field.

```jsx
import React from 'react';
import { useFormik } from 'formik';

const validate = values => {
  const errors = {};
  if (!values.firstName) {
    errors.firstName = 'Required';
  } else if (values.firstName.length > 15) {
    errors.firstName = 'Must be 15 characters or less';
  }

  if (!values.lastName) {
    errors.lastName = 'Required';
  } else if (values.lastName.length > 20) {
    errors.lastName = 'Must be 20 characters or less';
  }

  if (!values.email) {
    errors.email = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }

  return errors;
};

const SignupForm = () => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    validate,
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="firstName">First Name</label>
      <input
        id="firstName"
        name="firstName"
        type="text"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.firstName}
      />
      {formik.touched.firstName && formik.errors.firstName ? (
        <div>{formik.errors.firstName}</div>
      ) : null}
      <label htmlFor="lastName">Last Name</label>
      <input
        id="lastName"
        name="lastName"
        type="text"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.lastName}
      />
      {formik.touched.lastName && formik.errors.lastName ? (
        <div>{formik.errors.lastName}</div>
      ) : null}
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.email}
      />
      {formik.touched.email && formik.errors.email ? (
        <div>{formik.errors.email}</div>
      ) : null}
      <button type="submit">Submit</button>
    </form>
  );
};
```

### Schema Validation with Yup

As you can see above, validation is left up to you. Feel free to write your own validators or use a 3rd-party helper library. Formik's authors/a large portion of its users use [Jason Quense](https://github.com/jquense)'s library [Yup](https://github.com/jquense/yup) for object schema validation. Yup has an API that's similar to [Joi](https://github.com/hapijs/joi) / [React PropTypes](https://github.com/facebook/prop-types) but is also small enough for the browser and fast enough for runtime usage. You can try it out here with this [REPL](https://runkit.com/jquense/yup).

Since Formik authors/users _love_ Yup so much, Formik has a special configuration option / prop for Yup called `validationSchema` which will automatically transform Yup's validation errors messages into a pretty object whose keys match `values`/`initialValues`/`touched` (just like any custom validation function would have to). Anyways, you can install Yup from NPM/yarn like so...

```bash
npm install yup --save

# or via yarn

yarn add yup
```

To see how Yup works, let's get rid of our custom validation function `validate` and re-write our validation with Yup and `validationSchema`:

```jsx
import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const SignupForm = () => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string()
        .max(15, 'Must be 15 characters or less')
        .required('Required'),
      lastName: Yup.string()
        .max(20, 'Must be 20 characters or less')
        .required('Required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Required'),
    }),
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="firstName">First Name</label>
      <input
        id="firstName"
        name="firstName"
        type="text"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.firstName}
      />
      {formik.touched.firstName && formik.errors.firstName ? (
        <div>{formik.errors.firstName}</div>
      ) : null}
      <label htmlFor="lastName">Last Name</label>
      <input
        id="lastName"
        name="lastName"
        type="text"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.lastName}
      />
      {formik.touched.lastName && formik.errors.lastName ? (
        <div>{formik.errors.lastName}</div>
      ) : null}
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.email}
      />
      {formik.touched.email && formik.errors.email ? (
        <div>{formik.errors.email}</div>
      ) : null}
      <button type="submit">Submit</button>
    </form>
  );
};
```

Again, Yup is 100% optional. However, we suggest giving it a try. As you can see above, we expressed the exact same validation function with just 10 lines of code instead of 30. One of Formik's core design principles is to help you stay organized. Yup definitely helps a lot with this--schemas are extremely expressive, intuitive (since they mirror your values), and reusable. Whether or not you use Yup, it is highly recommended that you share commonly used validation methods across your application. This will ensure that common fields (e.g. email, street addresses, usernames, phone numbers, etc.) are validated consistently and result in a better user experience.

## Reducing Boilerplate

### `getFieldProps()`

The code above is very explicit about exactly what Formik is doing. `onChange` -> `handleChange`, `onBlur` -> `handleBlur`, and so on. However, to save you time, `useFormik()` returns a helper method called `formik.getFieldProps()` to make it faster to wire up inputs. Given some field-level info, it returns to you the exact group of `onChange`, `onBlur`, `value`, `checked` for a given field. You can then spread that on an input, select, or textarea.

```jsx
import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const SignupForm = () => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string()
        .max(15, 'Must be 15 characters or less')
        .required('Required'),
      lastName: Yup.string()
        .max(20, 'Must be 20 characters or less')
        .required('Required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Required'),
    }),
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="firstName">First Name</label>
      <input name="firstName" {...formik.getFieldProps('firstName')} />
      {formik.touched.firstName && formik.errors.firstName ? (
        <div>{formik.errors.firstName}</div>
      ) : null}
      <label htmlFor="lastName">Last Name</label>
      <input name="lastName" {...formik.getFieldProps('lastName')} />
      {formik.touched.lastName && formik.errors.lastName ? (
        <div>{formik.errors.lastName}</div>
      ) : null}
      <label htmlFor="email">Email Address</label>
      <input name="email" {...formik.getFieldProps('email')} />
      {formik.touched.email && formik.errors.email ? (
        <div>{formik.errors.email}</div>
      ) : null}
      <button type="submit">Submit</button>
    </form>
  );
};
```

### Leveraging React Context

Our code above is again very explicit about exactly what Formik is doing. `onChange` -> `handleChange`, `onBlur` -> `handleBlur`, and so on. However, we still have to manually pass each input this "prop getter" `getFieldProps()`. To save you even more time, Formik comes with [React Context](https://reactjs.org/docs/context.html)-powered API/component make life easier and less verbose: `<Formik />`, `<Form />`, `<Field />`, and `<ErrorMessage />`. More explicitly, they use React Context implicitly to connect to the parent `<Formik />` state/methods.

Since these components use React Context, we need to render a [React Context Provider](https://reactjs.org/docs/context.html#contextprovider) that holds our form state and helpers in our tree. If you did this yourself, it would look like:

```jsx
import React from 'react';
import { useFormik } from 'formik';

// Create empty context
const FormikContext = React.createContext({});

// Place all of what's returned by useFormik onto context
export const Formik = ({ children, ...props }) => {
  const formikStateAndHelpers = useFormik(props);
  return (
    <FormikContext.Provider value={formikStateAndHelpers}>
      {typeof children === 'function'
        ? children(formikStateAndHelpers)
        : children}
    </FormikContext.Provider>
  );
};
```

Luckily, we've done this for you and a `<Formik>` component that works just like this one comes with the package.

Let's now swap out the `useFormik()` hook for the Formik's `<Formik>` component/render-prop. Since it's a component, we'll convert the object passed to `useFormik()` to JSX, with each key becoming a prop.

```jsx
import React from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';

const SignupForm = () => {
  return (
    <Formik
      initialValues={{ firstName: '', lastName: '', email: '' }}
      validationSchema={Yup.object({
        firstName: Yup.string()
          .max(15, 'Must be 15 characters or less')
          .required('Required'),
        lastName: Yup.string()
          .max(20, 'Must be 20 characters or less')
          .required('Required'),
        email: Yup.string()
          .email('Invalid email address')
          .required('Required'),
      })}
      onSubmit={(values, { setSubmitting }) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          setSubmitting(false);
        }, 400);
      }}
    >
      {formik => (
        <form onSubmit={formik.handleSubmit}>
          <label htmlFor="firstName">First Name</label>
          <input id="firstName" {...formik.getFieldProps('firstName')} />
          {formik.touched.firstName && formik.errors.firstName ? (
            <div>{formik.errors.firstName}</div>
          ) : null}
          <label htmlFor="lastName">Last Name</label>
          <input id="lastName" {...formik.getFieldProps('lastName')} />
          {formik.touched.lastName && formik.errors.lastName ? (
            <div>{formik.errors.lastName}</div>
          ) : null}
          <label htmlFor="email">Email Address</label>
          <input id="email" {...formik.getFieldProps('email')} />
          {formik.touched.email && formik.errors.email ? (
            <div>{formik.errors.email}</div>
          ) : null}
          <button type="submit">Submit</button>
        </form>
      )}
    </Formik>
  );
};
```

As you can see above, we swapped out `useFormik()` hook and replaced it with the `<Formik>` component. The `<Formik>` accepts a function as its children (a.k.a. a render prop). Its argument is the _exact_ same object returned by `useFormik()` (in fact, `<Formik>` calls `useFormik()` internally!!). Thus, our form works the same as before, except now we can use new components to express ourselves in a more concise manner.

```jsx
import React from 'react';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const SignupForm = () => {
  return (
    <Formik
      initialValues={{ firstName: '', lastName: '', email: '' }}
      validationSchema={Yup.object({
        firstName: Yup.string()
          .max(15, 'Must be 15 characters or less')
          .required('Required'),
        lastName: Yup.string()
          .max(20, 'Must be 20 characters or less')
          .required('Required'),
        email: Yup.string()
          .email('Invalid email address')
          .required('Required'),
      })}
      onSubmit={(values, { setSubmitting }) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          setSubmitting(false);
        }, 400);
      }}
    >
      <Form>
        <label htmlFor="firstName">First Name</label>
        <Field name="firstName" type="text" />
        <ErrorMessage name="firstName" />
        <label htmlFor="lastName">Last Name</label>
        <Field name="lastName" type="text" />
        <ErrorMessage name="lastName" />
        <label htmlFor="email">Email Address</label>
        <Field name="email" type="email" />
        <ErrorMessage name="email" />
        <button type="submit">Submit</button>
      </Form>
    </Formik>
  );
};
```

The `<Field>` component by default will render an `<input>` component that given a `name` prop will implicitly grab the respective `onChange`, `onBlur`, `value` props and pass them to the element as well as any props you pass to it. However, since not everything is an input, `<Field>` also accepts a few other props to let you render whatever you want. Some examples..

```jsx
// <input className="form-input" placeHolder="Jane"  />
<Field name="firstName" className="form-input" placeholder="Jane" />

// <textarea className="form-textarea"/></textarea>
<Field name="message" as="textarea"  className="form-input"/>

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

// <input className="czx_123" placeHolder="google.com"  />
<Field name="website" as={MyStyledInput} placeHolder="google.com"/>

// <textarea  placeHolder="Post a message..." rows={5}></textarea>
<Field name="message" as={MyStyledTextArea} placeHolder="Post a message.." rows={5}/>
```

React is all about composition, and while we've cut down on a lot of the prop-drilling, we are still repeating ourselves with a `label`, `<Field>`, and `<ErrorMessage>` for each of our inputs. We can do better with an abstraction! With Formik, you can and should build reusable input primitive components that you can share around your application. Turns out our `<Field>` render-prop component has a sister and her name is `useField` that's going to do the same thing, but via React Hooks! Check this out...

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Formik, Form, useField } from 'formik';
import styled from '@emotion/styled';
import * as Yup from 'yup';

const MyTextInput = ({ label, ...props }) => {
  // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
  // which we can spread on <input> and also replace ErrorMessage entirely.
  const [field, meta] = useField(props);
  return (
    <>
      <label htmlFor={props.id || props.name}>{label}</label>
      <input className="text-input" {...field} {...props} />
      {meta.touched && meta.error ? (
        <div className="error">{meta.error}</div>
      ) : null}
    </>
  );
};

const MyCheckbox = ({ children, ...props }) => {
  // We need to tell useField what type of input this is
  // since React treats radios and checkboxes differently
  // than inputs/select/textarea.
  const [field, meta] = useField({ ...props, type: 'checkbox' });
  return (
    <>
      <label className="checkbox">
        <input type="checkbox" {...field} {...props} />
        {children}
      </label>
      {meta.touched && meta.error ? (
        <div className="error">{meta.error}</div>
      ) : null}
    </>
  );
};

// Styled components ....
const StyledSelect = styled.select`
  /** ... * /
`;

const StyledErrorMessage = styled.div`
  /** ... * /
`;

const StyledLabel = styled.label`
 /** ...* /
`;

const MySelect = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  return (
    <>
      <StyledLabel htmlFor={props.id || props.name}>{label}</StyledLabel>
      <StyledSelect {...field} {...props} />
      {meta.touched && meta.error ? (
        <StyledErrorMessage>{meta.error}</StyledErrorMessage>
      ) : null}
    </>
  );
};

// And now we can use these
const SignupForm = () => {
  return (
    <>
      <h1>Subscribe!</h1>
      <Formik
        initialValues={{
          firstName: '',
          lastName: '',
          email: '',
          acceptedTerms: false, // added for our checkbox
          jobType: '', // added for our select
        }}
        validationSchema={Yup.object({
          firstName: Yup.string()
            .max(15, 'Must be 15 characters or less')
            .required('Required'),
          lastName: Yup.string()
            .max(20, 'Must be 20 characters or less')
            .required('Required'),
          email: Yup.string()
            .email('Invalid email address')
            .required('Required'),
          acceptedTerms: Yup.boolean()
            .required('Required')
            .oneOf([true], 'You must accept the terms and conditions.'),
          jobType: Yup.string()
            .oneOf(
              ['designer', 'development', 'product', 'other'],
              'Invalid Job Type'
            )
            .required('Required'),
        })}
        onSubmit={(values, { setSubmitting }) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2));
            setSubmitting(false);
          }, 400);
        }}
      >
        <Form>
          <MyTextInput
            label="First Name"
            name="firstName"
            type="text"
            placeholder="Jane"
          />
          <MyTextInput
            label="Last Name"
            name="lastName"
            type="text"
            placeholder="Doe"
          />
          <MyTextInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="jane@formik.com"
          />
          <MySelect label="Job Type" name="jobType">
            <option value="">Select a job type</option>
            <option value="designer">Designer</option>
            <option value="development">Developer</option>
            <option value="product">Product Manager</option>
            <option value="other">Other</option>
          </MySelect>
          <MyCheckbox name="acceptedTerms">
            I accept the terms and conditions
          </MyCheckbox>

          <button type="submit">Submit</button>
        </Form>
      </Formik>
    </>
  );
};
```

As you can see above, `useField()` gives us the ability to connect any kind input of React component to Formik as if it were a `<Field>` + `<ErrorMessage>`. We can use it to build a group of reusable inputs that fit our needs.

## Wrapping Up

Congratulations! You've created a signup form with Formik that:

- Has complex validation logic and rich error messages
- Properly displays errors messages to the user at the correct time (after they have blurred a field)
- Leverages your own custom input components you can use on other forms in your app

Nice work! We hope you now feel like you have a decent grasp on how Formik works.

Check out the final result here: [Final Result](https://codesandbox.io/s/formik-v2-tutorial-final-ge1pt).

If you have extra time or want to practice your new Formik skills, here are some ideas for improvements that you could make to the signup form which are listed in order of increasing difficulty:

- Disable the submit button while the user is attempted a submit (hint: `formik.isSubmitting`)
- Add a reset button with `formik.handleReset` or `<button type="reset">`.
- Prepopulate `initialValues` based on URL query string or props passed to `<SignupForm>`.
- Change input border color to red when a field has an error and isn't focused
- Add a shake animation to each field when it displays an error and has been visited
- Persist form state to the browser's sessionStorage so that form progress is kept inbetween page refreshes

Throughout this tutorial, we touched on Formik concepts including form state, fields, validation, hooks, render props, and React context. For a more detailed explanation of each of these topics, check out the rest of the [documentation](https://jaredpalmer.com/formik/docs/next/overview). To learn more about defining the components and hooks in the tutorial, check out the [API reference](https://jaredpalmer.com/formik/docs/next/api/formik).
