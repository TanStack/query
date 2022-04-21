import * as React from 'react'
import { flag } from 'country-emoji'
import useLocalStorage from './useLocalStorage'
import { AnimatePresence, motion } from 'framer-motion'
import { IoIosClose } from 'react-icons/io'

function useClientOnlyRender() {
  const [rendered, setRendered] = React.useState(false)
  React.useEffect(() => {
    setRendered(true)
  }, [])
  return rendered
}
export function PPPBanner() {
  const [hidden, setHidden] = useLocalStorage('pppbanner-hidden', false)
  const [data, setData] = useLocalStorage('pppbanner-data', null)

  React.useEffect(() => {
    // This function has CORS configured to allow
    // react-query.tanstack.com and tanstack.com
    if (!data) {
      fetch('https://ui.dev/api/ppp-discount')
        .then(res => res.json())
        .then(res => {
          if (res?.code) {
            setData(res)
          }
        })
    }
  }, [data, setData])

  if (!useClientOnlyRender()) {
    return null
  }

  return (
    <AnimatePresence initial={false}>
      {data && !hidden && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full bg-coral text-white text-center py-2 relative flex items-center justify-center"
        >
          <p>
            {flag(data.code)} We noticed you're in{' '}
            <strong>{data.country}</strong>. Get{' '}
            <strong>{data.discount * 100}% off</strong> the Official React Query
            Course with code{' '}
            <a
              className="underline cursor-pointer"
              href={`https://ui.dev/react-query?from=tanstack&coupon_code=${data.coupon}`}
            >
              <strong>{data.coupon}</strong>
            </a>
            .
          </p>
          <button
            onClick={() => setHidden(true)}
            className="absolute right-0"
            aria-label="Hide Banner"
          >
            <IoIosClose size={30} className="text-white" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
