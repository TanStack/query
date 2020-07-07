---
id: fieldarray
title: <FieldArray />
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/fieldarray.md
---

`<FieldArray />` is a component that helps with common array/list manipulations. You pass it a `name` property with the path to the key within `values` that holds the relevant array. `<FieldArray />` will then give you access to array helper methods via render props. For convenience, calling these methods will trigger validation and also manage `touched` for you.

```jsx
import React from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';

// Here is an example of a form with an editable list.
// Next to each input are buttons for insert and remove.
// If the list is empty, there is a button to add an item.
export const FriendList = () => (
  <div>
    <h1>Friend List</h1>
    <Formik
      initialValues={{ friends: ['jared', 'ian', 'brent'] }}
      onSubmit={values =>
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
        }, 500)
      }
      render={({ values }) => (
        <Form>
          <FieldArray
            name="friends"
            render={arrayHelpers => (
              <div>
                {values.friends && values.friends.length > 0 ? (
                  values.friends.map((friend, index) => (
                    <div key={index}>
                      <Field name={`friends.${index}`} />
                      <button
                        type="button"
                        onClick={() => arrayHelpers.remove(index)} // remove a friend from the list
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => arrayHelpers.insert(index, '')} // insert an empty string at a position
                      >
                        +
                      </button>
                    </div>
                  ))
                ) : (
                  <button type="button" onClick={() => arrayHelpers.push('')}>
                    {/* show this when user has removed all friends from the list */}
                    Add a friend
                  </button>
                )}
                <div>
                  <button type="submit">Submit</button>
                </div>
              </div>
            )}
          />
        </Form>
      )}
    />
  </div>
);
```

### `name: string`

The name or path to the relevant key in [`values`](/docs/api/formik.md#values-field-string-any).

### `validateOnChange?: boolean`

Default is `true`. Determines if form validation should or should not be run _after_ any array manipulations.

## FieldArray Array of Objects

You can also iterate through an array of objects, by following a convention of `object[index]property` or `object.index.property` for the name attributes of `<Field />` or `<input />` elements in `<FieldArray />`.

```jsx
<Form>
  <FieldArray
    name="friends"
    render={arrayHelpers => (
      <div>
        {values.friends.map((friend, index) => (
          <div key={index}>
            <Field name={`friends[${index}].name`} />
            <Field name={`friends.${index}.age`} /> // both these conventions do
            the same
            <button type="button" onClick={() => arrayHelpers.remove(index)}>
              -
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => arrayHelpers.push({ name: '', age: '' })}
        >
          +
        </button>
      </div>
    )}
  />
</Form>
```

## FieldArray Validation Gotchas

Validation can be tricky with `<FieldArray>`.

If you use [`validationSchema`](/docs/api/formik.md#validationschema-schema-schema) and your form has array validation requirements (like a min length) as well as nested array field requirements, displaying errors can be tricky. Formik/Yup will show validation errors inside out. For example,

```js
const schema = Yup.object().shape({
  friends: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string()
          .min(4, 'too short')
          .required('Required'), // these constraints take precedence
        salary: Yup.string()
          .min(3, 'cmon')
          .required('Required'), // these constraints take precedence
      })
    )
    .required('Must have friends') // these constraints are shown if and only if inner constraints are satisfied
    .min(3, 'Minimum of 3 friends'),
});
```

Since Yup and your custom validation function should always output error messages as strings, you'll need to sniff whether your nested error is an array or a string when you go to display it.

So...to display `'Must have friends'` and `'Minimum of 3 friends'` (our example's array validation constraints)...

**_Bad_**

```jsx
// within a `FieldArray`'s render
const FriendArrayErrors = errors =>
  errors.friends ? <div>{errors.friends}</div> : null; // app will crash
```

**_Good_**

```jsx
// within a `FieldArray`'s render
const FriendArrayErrors = errors =>
  typeof errors.friends === 'string' ? <div>{errors.friends}</div> : null;
```

For the nested field errors, you should assume that no part of the object is defined unless you've checked for it. Thus, you may want to do yourself a favor and make a custom `<ErrorMessage />` component that looks like this:

```jsx
import { Field, getIn } from 'formik';

const ErrorMessage = ({ name }) => (
  <Field
    name={name}
    render={({ form }) => {
      const error = getIn(form.errors, name);
      const touch = getIn(form.touched, name);
      return touch && error ? error : null;
    }}
  />
);

// Usage
<ErrorMessage name="friends[0].name" />; // => null, 'too short', or 'required'
```

_NOTE_: In Formik v0.12 / 1.0, a new `meta` prop may be added to `Field` and `FieldArray` that will give you relevant metadata such as `error` & `touch`, which will save you from having to use Formik or lodash's getIn or checking if the path is defined on your own.

## FieldArray Helpers

The following methods are made available via render props.

- `push: (obj: any) => void`: Add a value to the end of an array
- `swap: (indexA: number, indexB: number) => void`: Swap two values in an array
- `move: (from: number, to: number) => void`: Move an element in an array to another index
- `insert: (index: number, value: any) => void`: Insert an element at a given index into the array
- `unshift: (value: any) => number`: Add an element to the beginning of an array and return its length
- `remove<T>(index: number): T | undefined`: Remove an element at an index of an array and return it
- `pop<T>(): T | undefined`: Remove and return value from the end of the array
- `replace: (index: number, value: any) => void`: Replace a value at the given index into the array

## FieldArray render methods

There are three ways to render things with `<FieldArray />`

- `<FieldArray name="..." component>`
- `<FieldArray name="..." render>`
- `<FieldArray name="..." children>`

### `render: (arrayHelpers: ArrayHelpers) => React.ReactNode`

```jsx
import React from 'react';
import { Formik, Form, Field, FieldArray } from 'formik'

export const FriendList = () => (
  <div>
    <h1>Friend List</h1>
    <Formik
      initialValues={{ friends: ['jared', 'ian', 'brent'] }}
      onSubmit={...}
      render={formikProps => (
        <FieldArray
          name="friends"
          render={({ move, swap, push, insert, unshift, pop }) => (
            <Form>
              {/*... use these however you want */}
            </Form>
          )}
        />
    />
  </div>
);
```

### `component: React.ReactNode`

```jsx
import React from 'react';
import { Formik, Form, Field, FieldArray } from 'formik'


export const FriendList = () => (
  <div>
    <h1>Friend List</h1>
    <Formik
      initialValues={{ friends: ['jared', 'ian', 'brent'] }}
      onSubmit={...}
      render={formikProps => (
        <FieldArray
          name="friends"
          component={MyDynamicForm}
        />
      )}
    />
  </div>
);


// In addition to the array helpers, Formik state and helpers
// (values, touched, setXXX, etc) are provided through a `form`
// prop
export const MyDynamicForm = ({
  move, swap, push, insert, unshift, pop, form
}) => (
 <Form>
  {/**  whatever you need to do */}
 </Form>
);
```

### `children: func`

```jsx
import React from 'react';
import { Formik, Form, Field, FieldArray } from 'formik'


export const FriendList = () => (
  <div>
    <h1>Friend List</h1>
    <Formik
      initialValues={{ friends: ['jared', 'ian', 'brent'] }}
      onSubmit={...}
      render={formikProps => (
        <FieldArray name="friends">
          {({ move, swap, push, insert, unshift, pop, form }) => {
            return (
              <Form>
                {/*... use these however you want */}
              </Form>
            );
          }}
        </FieldArray>
      )}
    />
  </div>
);
```
