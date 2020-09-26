---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because React Query comes with dedicated devtools! 🥳

When you begin your React Query journey, you'll want these devtools by your side. They help visualize all of the inner workings of React Query and will likely save you hours of debugging if you find yourself in a pinch!

> Please note that for now, the devtools **do not support React Native**. If you would like to help use mae the devtools platform agnostic, please let us know!

## Quick Installation

To get going as fast as possible, do the following:

```bash
$ npm i --save react-query-devtools
# or
$ yarn add react-query-devtools
```

Place the following code as high in your React app as you can. The closer it is to the root of the page, the better it will work!

```js
import { ReactQueryDevtools } from 'react-query-devtools'

function App() {
  return (
    <>
      {/* The rest of your application */}
      <ReactQueryDevtools initialIsOpen />
    </>
  )
}
```

## Need more control?

Visit the [React Query Devtools Github Repo](https://github.com/tannerlinsley/react-query-devtools) for more documentation!
