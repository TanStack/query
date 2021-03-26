import React from 'react'

export default function CarbonAds() {
  React.useEffect(() => {
    if (window._carbonads) {
      window._carbonads.refresh()
    }
  }, [])

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<script async type="text/javascript" src="//cdn.carbonads.com/carbon.js?serve=CESDV23N&placement=react-querytanstackcom" id="_carbonads_js"></script>`,
      }}
    ></div>
  )
}
