---
id: connect
title: connect()
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/connect.md
---

`connect()` is a higher-order component (HoC) that allows you to hook anything into Formik's context. It is used internally to construct `<Field>` and `<Form>`, but you can use it to build out new components as your needs change.

## Type signature

```tsx
connect<OuterProps, Values = any>(Comp: React.ComponentType<OuterProps & { formik: FormikContext<Values> }>) => React.ComponentType<OuterProps>
```

## Example

```jsx
import React from 'react';
import { connect, getIn } from 'formik';

// This component renders an error message if a field has
// an error and it's already been touched.
const ErrorMessage = props => {
  // All FormikProps available on props.formik!
  const error = getIn(props.formik.errors, props.name);
  const touch = getIn(props.formik.touched, props.name);
  return touch && error ? error : null;
};

export default connect(ErrorMessage);
```
