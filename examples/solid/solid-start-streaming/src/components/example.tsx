import type { ParentComponent } from 'solid-js'

export interface ExampleProps {
  title: string
  deferStream?: boolean
  sleep?: number
}

export const Example: ParentComponent<ExampleProps> = (props) => {
  return (
    <div class="example">
      <div class="example__header">
        <div class="example__title">{props.title}</div>
        <div>[deferStream={String(props.deferStream || false)}]</div>
        <div style={{ 'margin-left': '10px' }}>
          [simulated sleep: {props.sleep || 0}ms]
        </div>
      </div>

      {props.children}
    </div>
  )
}
