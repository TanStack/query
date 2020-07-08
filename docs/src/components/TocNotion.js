import * as React from 'react';
import cx from 'classnames';
import { useTocHighlight } from './useTocHighlight';
import styles from './Toc.module.css';
import { NOTION_ANCHOR_CLASSNAME } from './blog/Heading';
const TOP_OFFSET = 100;

const getHeadingDataFromAnchor = el => {
  return {
    text: el.getAttribute('data-heading-text'),
    depth: Number(el.getAttribute('data-heading-depth')),
    url: el.getAttribute('href')
  };
};

export function getHeaderNotionAnchors() {
  /**
   * .filter() does not exist on HTMLCollectionOf<Element>
   *  (the return type of document.getElementByClassName()),
   *  so we use this as a workaround.
   */
  return Array.prototype.filter.call(document.getElementsByClassName(NOTION_ANCHOR_CLASSNAME), function (testElement) {
    return testElement.firstElementChild?.nodeName === 'H2' || testElement.firstElementChild?.nodeName === 'H3';
  });
}
export const TocNotion = () => {
  const headings = useTocHighlight(styles.contents__link, styles['contents__link--active'], TOP_OFFSET, getHeaderNotionAnchors, getHeadingDataFromAnchor, el => el?.id);
  return <>
      <h4 className="text-gray-700 font-semibold mb-3">Table of Contents</h4>
      <ul className="space-y-3">
        {headings && headings.length > 0 && headings.map((h, i) => h.url ? <li key={`heading-${h.url}-${i}`} className={cx('text-base ', {
        ['pl-2']: h?.depth === 3,
        ['hidden']: h.depth && h.depth > 3
      })}>
                <a className={styles.contents__link} href={h.url}>
                  {h.text}
                </a>
              </li> : null)}
      </ul>
    </>;
};