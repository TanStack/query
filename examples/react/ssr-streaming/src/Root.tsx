import { App } from './App'

export function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite App</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <App />
      </body>
    </html>
  )
}
