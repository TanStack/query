import { Link, Outlet } from 'react-router-dom'

export function Root() {
  return (
    <>
      <nav>
        <Link to="/posts">Posts</Link> <Link to="/about">About</Link>
      </nav>
      <Outlet />
    </>
  )
}
