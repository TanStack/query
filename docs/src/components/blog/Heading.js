import * as React from 'react';

const collectText = (el, acc = []) => {
  if (el) {
    if (typeof el === 'string') acc.push(el);
    if (Array.isArray(el)) el.map(item => collectText(item, acc));
    if (typeof el === 'object') collectText(el.props && el.props.children, acc);
  }

  return acc.join('').trim();
}; // Structure is in Heading


export const getTocDataFromHeading = el => {
  return {
    text: el.parentElement?.getAttribute('[data-text]'),
    url: el.parentElement?.getAttribute('href')
  };
};
export const NOTION_ANCHOR_CLASSNAME = 'notion-anchor';
export default (({
  children: component,
  id
}) => {
  const children = component.props.children || '';
  let text = children;

  if (null == id) {
    id = collectText(text).toLowerCase().replace(/\s/g, '-').replace(/[?!:]/g, '');
  }

  return <a href={`#${id}`} id={id} className={NOTION_ANCHOR_CLASSNAME} style={{
    color: 'inherit'
  }} data-heading-text={collectText(text)} data-heading-depth={component.type.replace('h', '')}>
      {component}
    </a>;
});