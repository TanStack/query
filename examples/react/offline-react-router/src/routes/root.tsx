import { Outlet } from 'react-router'
import { Toaster } from 'react-hot-toast'

export default function Root() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}
