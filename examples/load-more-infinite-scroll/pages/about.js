export default () => {
  return (
    <a
      href=""
      onClick={e => {
        window.history.back()
        e.preventDefault()
      }}
    >
      Back
    </a>
  )
}
