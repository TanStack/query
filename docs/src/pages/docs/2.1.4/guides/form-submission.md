---
id: form-submission
title: Form Submission
custom_edit_url: https://github.com/jaredpalmer/formik/edit/master/docs/guides/form-submission.md
---

## Submission Phases

To submit a form in Formik, you need to somehow fire off the provided `handleSubmit(e)` or `submitForm` prop. When you call either of these methods, Formik will execute the following _(pseudo code)_ each time:

### Pre-submit

- Touch all fields. `initialValues` are required and should always be specified. See [#445](https://github.com/jaredpalmer/formik/issues/445#issuecomment-366952762)
- Set `isSubmitting` to `true`
- Increment `submitCount` + 1

### Validation

- Set `isValidating` to `true`
- Run all field-level validations, `validate`, and `validationSchema` asynchronously and deeply merge results
- Are there any errors?
  - Yes: Abort submission. Set `isValidating` to `false`, set `errors`, set `isSubmitting` to `false`
  - No: Set `isValidating` to `false`, proceed to "Submission"

### Submission

- Proceed with running your submission handler (i.e.`onSubmit` or `handleSubmit`)
- _you call `setSubmitting(false)`_ in your handler to finish the cycle

## Frequently Asked Questions

<details>
<summary>How do I determine if my submission handler is executing?</summary>

If `isValidating` is `false` and `isSubmitting` is `true`.

</details>

<details>
<summary>Why does Formik touch all fields before submit?</summary>

It is common practice to only show an input's errors in the UI if it has been visited (a.k.a "touched"). Before submitting a form, Formik touches all fields so that all errors that may have been hidden will now be visible.

</details>

<details>
<summary>How do I protect against double submits?</summary>

Disable whatever is triggering submission if `isSubmitting` is `true`.

</details>

<details>
<summary>How do I know when my form is validating before submit?</summary>

If `isValidating` is `true` and `isSubmitting` is `true`.

</details>
