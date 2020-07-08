import * as React from 'react'
import cx from 'classnames'
import { useTocHighlight } from './useTocHighlight'
import styles from './Toc.module.css'
const TOP_OFFSET = 100

function getHeaderAnchors() {
  return Array.prototype.filter.call(
    document.getElementsByClassName('anchor'),
    function (testElement) {
      return (
        testElement.parentNode.nodeName === 'H2' ||
        testElement.parentNode.nodeName === 'H3'
      )
    }
  )
}

function getHeaderDataFromAnchors(el) {
  return {
    url: el.getAttribute('href'),
    text: el.parentElement?.innerText,
    depth: Number(el.parentElement?.nodeName.replace('H', '')),
  }
}

export const Toc = () => {
  const headings = useTocHighlight(
    styles.contents__link,
    styles['contents__link--active'],
    TOP_OFFSET,
    getHeaderAnchors,
    getHeaderDataFromAnchors,
    el => el?.parentElement?.id
  )

  return (
    <ul className="space-y-3">
      {headings &&
        headings.length > 0 &&
        headings.map((h, i) =>
          h.url ? (
            <li
              key={`heading-${h.url}-${i}`}
              className={cx('text-sm ', {
                'pl-2': h?.depth === 3,
                hidden: h.depth && h.depth > 3,
              })}
            >
              <a className={styles.contents__link} href={h.url}>
                {h.text}
              </a>
            </li>
          ) : null
        )}
    </ul>
  )
}
