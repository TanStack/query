import * as React from 'react';
export default function ExternalLink(props) {
  return <a {...props} rel="noopener" target={props.target || '_blank'} />;
}