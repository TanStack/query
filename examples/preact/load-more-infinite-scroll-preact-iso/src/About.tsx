export default function About() {
  return (
    <a
      href=""
      onClick={(e) => {
        window.history.back()
        e.preventDefault()
      }}
    >
      Back
    </a>
  )
}
