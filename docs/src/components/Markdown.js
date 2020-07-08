import * as React from 'react';
import markdownStyles from './markdown.module.css';
export const Markdown = ({
  html: content
}) => {
  return <div className={markdownStyles['markdown']} dangerouslySetInnerHTML={{
    __html: content
  }} />;
};
Markdown.displayName = 'PostBody';