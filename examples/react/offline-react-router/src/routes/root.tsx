import { Toaster } from 'react-hot-toast'
import { Outlet } from 'react-router'

export default function Root() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}
