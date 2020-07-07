---
id: form
title: <Form />
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/api/form.md
---

Form is a small wrapper around an HTML `<form>` element that automatically hooks into Formik's `handleSubmit` and `handleReset`. All other props are passed directly through to the DOM node.

```jsx
// so...
<Form />

// is identical to this...
<form onReset={formikProps.handleReset} onSubmit={formikProps.handleSubmit} {...props} />
```
