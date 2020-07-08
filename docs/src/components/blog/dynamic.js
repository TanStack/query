import dynamic from 'next/dynamic';
import ExtLink from './ExternalLink';
export default {
  // default tags
  ol: 'ol',
  ul: 'ul',
  li: 'li',
  p: 'p',
  blockquote: 'blockquote',
  a: ExtLink,
  Image: dynamic(() => import('./Image')),
  Code: dynamic(() => import('../Highlight')) // Counter: dynamic(() => import('./counter')),

};