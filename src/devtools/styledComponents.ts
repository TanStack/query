// @ts-nocheck

import { styled } from './utils'

export const Panel = styled(
  'div',
  (props, theme) => ({
    fontSize: 'clamp(12px, 1.5vw, 14px)',
    fontFamily: `sans-serif`,
    display: 'flex',
    backgroundColor: theme.background,
    color: theme.foreground,
  }),
  {
    '(max-width: 700px)': {
      flexDirection: 'column',
    },
    '(max-width: 600px)': {
      fontSize: '.9rem',
      // flexDirection: 'column',
    },
  }
)

export const ActiveQueryPanel = styled(
  'div',
  (props, theme) => ({
    flex: '1 1 500px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    height: '100%',
  }),
  {
    '(max-width: 700px)': (props, theme) => ({
      borderTop: `2px solid ${theme.gray}`,
    }),
  }
)

export const Button = styled('button', (props, theme) => ({
  appearance: 'none',
  fontSize: '.9em',
  fontWeight: 'bold',
  background: theme.gray,
  border: '0',
  borderRadius: '.3em',
  color: 'white',
  padding: '.5em',
  opacity: props.disabled ? '.5' : undefined,
  cursor: 'pointer',
}))

export const QueryKeys = styled('span', {
  display: 'inline-block',
  fontSize: '0.9em',
})

export const QueryKey = styled('span', {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '.2em .4em',
  fontWeight: 'bold',
  textShadow: '0 0 10px black',
  borderRadius: '.2em',
})

export const Code = styled('code', {
  fontSize: '.9em',
})

export const Input = styled('input', (props, theme) => ({
  backgroundColor: theme.inputBackgroundColor,
  border: 0,
  borderRadius: '.2em',
  color: theme.inputTextColor,
  fontSize: '.9em',
  lineHeight: `1.3`,
  padding: '.3em .4em',
}))

export const Select = styled(
  'select',
  (props, theme) => ({
    display: `inline-block`,
    fontSize: `.9em`,
    fontFamily: `sans-serif`,
    fontWeight: 'normal',
    lineHeight: `1.3`,
    padding: `.3em 1.5em .3em .5em`,
    height: 'auto',
    border: 0,
    borderRadius: `.2em`,
    appearance: `none`,
    WebkitAppearance: 'none',
    backgroundColor: theme.inputBackgroundColor,
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23444444'><polygon points='0,25 100,25 50,75'/></svg>")`,
    backgroundRepeat: `no-repeat`,
    backgroundPosition: `right .55em center`,
    backgroundSize: `.65em auto, 100%`,
    color: theme.inputTextColor,
  }),
  {
    '(max-width: 500px)': {
      display: 'none',
    },
  }
)
