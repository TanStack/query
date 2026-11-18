import cssText from './styles.css?inline'
import type { DevtoolsButtonPosition } from './contexts'

type Theme = 'light' | 'dark'
type StatusColor = 'green' | 'yellow' | 'gray' | 'blue' | 'purple' | 'red'
type ActionColor = 'blue' | 'yellow' | 'gray' | 'pink' | 'cyan' | 'red'

/**
 * Creates the class names from styles.css for a theme. Classes with dark
 * theme values also get their `-dark` modifier in the dark theme.
 * @param theme - The devtools theme.
 * @returns The class names.
 */
const createStyles = (theme: Theme) => {
  const themed = (name: string) =>
    theme === 'dark' ? `${name} ${name}-dark` : name

  return {
    devtoolsBtn: 'tsqd-style-devtools-btn',
    panel: themed('tsqd-style-panel'),
    parentPanel: themed('tsqd-style-parent-panel'),
    'devtoolsBtn-position-bottom-right':
      'tsqd-style-devtools-btn-position-bottom-right',
    'devtoolsBtn-position-bottom-left':
      'tsqd-style-devtools-btn-position-bottom-left',
    'devtoolsBtn-position-top-left':
      'tsqd-style-devtools-btn-position-top-left',
    'devtoolsBtn-position-top-right':
      'tsqd-style-devtools-btn-position-top-right',
    'devtoolsBtn-position-relative':
      'tsqd-style-devtools-btn-position-relative',
    'panel-position-top': themed('tsqd-style-panel-position-top'),
    'panel-position-bottom': themed('tsqd-style-panel-position-bottom'),
    'panel-position-right': themed('tsqd-style-panel-position-right'),
    'panel-position-left': themed('tsqd-style-panel-position-left'),
    closeBtn: themed('tsqd-style-close-btn'),
    'closeBtn-position-top': themed('tsqd-style-close-btn-position-top'),
    'closeBtn-position-bottom': themed('tsqd-style-close-btn-position-bottom'),
    'closeBtn-position-right': themed('tsqd-style-close-btn-position-right'),
    'closeBtn-position-left': themed('tsqd-style-close-btn-position-left'),
    queriesContainer: themed('tsqd-style-queries-container'),
    dragHandle: themed('tsqd-style-drag-handle'),
    'dragHandle-position-top': 'tsqd-style-drag-handle-position-top',
    'dragHandle-position-bottom': 'tsqd-style-drag-handle-position-bottom',
    'dragHandle-position-right': 'tsqd-style-drag-handle-position-right',
    'dragHandle-position-left': 'tsqd-style-drag-handle-position-left',
    row: themed('tsqd-style-row'),
    logoAndToggleContainer: 'tsqd-style-logo-and-toggle-container',
    logo: 'tsqd-style-logo',
    tanstackLogo: themed('tsqd-style-tanstack-logo'),
    queryFlavorLogo: themed('tsqd-style-query-flavor-logo'),
    queryStatusContainer: 'tsqd-style-query-status-container',
    queryStatusTag: themed('tsqd-style-query-status-tag'),
    queryStatusTagLabel: 'tsqd-style-query-status-tag-label',
    queryStatusCount: themed('tsqd-style-query-status-count'),
    statusTooltip: themed('tsqd-style-status-tooltip'),
    filtersContainer: themed('tsqd-style-filters-container'),
    filterInput: themed('tsqd-style-filter-input'),
    filterScopeBtn: themed('tsqd-style-filter-scope-btn'),
    filterSelect: themed('tsqd-style-filter-select'),
    actionsContainer: 'tsqd-style-actions-container',
    actionsBtn: themed('tsqd-style-actions-btn'),
    actionsBtnOffline: themed('tsqd-style-actions-btn-offline'),
    overflowQueryContainer: 'tsqd-style-overflow-query-container',
    queryRow: themed('tsqd-style-query-row'),
    selectedQueryRow: themed('tsqd-style-selected-query-row'),
    detailsContainer: themed('tsqd-style-details-container'),
    detailsHeader: themed('tsqd-style-details-header'),
    detailsBody: 'tsqd-style-details-body',
    queryDetailsStatus: 'tsqd-style-query-details-status',
    actionsBody: themed('tsqd-style-actions-body'),
    actionsSelect: themed('tsqd-style-actions-select'),
    settingsMenu: themed('tsqd-style-settings-menu'),
    settingsSubTrigger: themed('tsqd-style-settings-sub-trigger'),
    settingsMenuHeader: themed('tsqd-style-settings-menu-header'),
    settingsSubButton: themed('tsqd-style-settings-sub-button'),
    viewToggle: themed('tsqd-style-view-toggle'),
    devtoolsEditForm: themed('tsqd-style-devtools-edit-form'),
    devtoolsEditTextarea: themed('tsqd-style-devtools-edit-textarea'),
    devtoolsEditFormActions: 'tsqd-style-devtools-edit-form-actions',
    devtoolsEditFormError: themed('tsqd-style-devtools-edit-form-error'),
    devtoolsEditFormActionContainer:
      'tsqd-style-devtools-edit-form-action-container',
    devtoolsEditFormAction: themed('tsqd-style-devtools-edit-form-action'),
    /**
     * The panel and button transitions.
     * @param vertical - Whether the panel opens from the top or the bottom.
     * @param buttonPosition - The position of the open button.
     * @returns The class names.
     */
    transitionsContainer: (
      vertical: boolean,
      buttonPosition: DevtoolsButtonPosition,
    ) =>
      `tsqd-style-transitions tsqd-style-transitions-${vertical ? 'vertical' : 'horizontal'} tsqd-style-transitions-button-${buttonPosition}`,
    /**
     * Lays the list and the details out stacked or side by side.
     * @param stacked - Whether the details are below the list instead of beside it.
     * @returns The class name.
     */
    panelLayout: (stacked: boolean) =>
      stacked
        ? themed('tsqd-style-panel-column')
        : themed('tsqd-style-panel-row'),
    panelMinContent: 'tsqd-style-panel-min-content',
    queriesContainerHeight: (half: boolean) =>
      half
        ? 'tsqd-style-queries-container-half'
        : 'tsqd-style-queries-container-full',
    observerCount: (color: StatusColor) =>
      themed(`tsqd-style-observer-count-${color}`),
    queryStatusTagClickable: themed('tsqd-style-query-status-tag-clickable'),
    queryStatusDot: (color: StatusColor) =>
      `tsqd-style-query-status-dot tsqd-style-query-status-dot-${color}`,
    queryStatusCountColor: (color: Exclude<StatusColor, 'gray'>) =>
      themed(`tsqd-style-query-status-count-${color}`),
    detailsStatus: (color: StatusColor) =>
      themed(`tsqd-style-details-status-${color}`),
    action: (color: ActionColor) => themed(`tsqd-style-action-${color}`),
    actionDot: (color: ActionColor) => themed(`tsqd-style-action-dot-${color}`),
    actionSelectDot: 'tsqd-style-action-select-dot',
  }
}

/**
 * Creates the explorer class names from styles.css for a theme.
 * @param theme - The devtools theme.
 * @returns The class names.
 */
const createExplorerStyles = (theme: Theme) => {
  const themed = (name: string) =>
    theme === 'dark' ? `${name} ${name}-dark` : name

  return {
    search: 'tsqd-style-explorer-search',
    searchInput: themed('tsqd-style-explorer-search-input'),
    clearSearch: 'tsqd-style-explorer-clear-search',
    highlight: themed('tsqd-style-explorer-highlight'),
    entry: 'tsqd-style-explorer-entry',
    subEntry: themed('tsqd-style-explorer-sub-entry'),
    expander: 'tsqd-style-explorer-expander',
    expanderButtonContainer: 'tsqd-style-explorer-expander-button-container',
    expanderButton: 'tsqd-style-explorer-expander-button',
    info: 'tsqd-style-explorer-info',
    label: themed('tsqd-style-explorer-label'),
    value: themed('tsqd-style-explorer-value'),
    actions: 'tsqd-style-explorer-actions',
    row: 'tsqd-style-explorer-row',
    editableInput: themed('tsqd-style-explorer-editable-input'),
    actionButton: themed('tsqd-style-explorer-action-button'),
    expanderExpanded: 'tsqd-style-explorer-expander-expanded',
    toggleButton: 'tsqd-style-explorer-toggle-button',
    /** Styles the `tsqd-data-search` highlight of the matches inside. */
    searchRoot: themed('tsqd-style-explorer-search-root'),
  }
}

const styles = { light: createStyles('light'), dark: createStyles('dark') }
const explorerStyles = {
  light: createExplorerStyles('light'),
  dark: createExplorerStyles('dark'),
}

/**
 * Returns the devtools class names for a theme.
 * @param theme - The devtools theme.
 * @returns The class names.
 */
export const getStyles = (theme: Theme) => styles[theme]

/**
 * Returns the explorer class names for a theme.
 * @param theme - The devtools theme.
 * @returns The class names.
 */
export const getExplorerStyles = (theme: Theme) => explorerStyles[theme]

// One constructed stylesheet per window: a constructed stylesheet can only be
// adopted by the document and shadow roots of the window that created it.
const sheets = new WeakMap<Window, CSSStyleSheet>()

/**
 * Adopts the devtools stylesheet where `el` renders: the given
 * `shadowDOMTarget`, else the shadow root that contains `el`, else the
 * document that owns `el`. Adopted stylesheets are not `<style>` elements, so
 * they need no CSP nonce and no Trusted Types policy.
 * @param el - A connected element of the devtools.
 * @param nonce - The nonce of the fallback `<style>` element.
 * @param shadowDOMTarget - The shadow root to add the styles to.
 */
export function attachStyles(
  el: Element,
  nonce?: string,
  shadowDOMTarget?: ShadowRoot,
) {
  const root = el.getRootNode()
  const container: Document | ShadowRoot =
    shadowDOMTarget ??
    // A shadow root is a document fragment with a host. `instanceof ShadowRoot`
    // would miss shadow roots from other windows, e.g. picture-in-picture.
    (root.nodeType === 11 && 'host' in root
      ? (root as ShadowRoot)
      : el.ownerDocument)
  const view =
    ('defaultView' in container
      ? container.defaultView
      : container.ownerDocument.defaultView) ?? window

  // Without adoptable stylesheets (Safari < 16.4, Firefox < 101), fall back
  // to a <style> element.
  if (!('adoptedStyleSheets' in (container as object))) {
    const parent = container.nodeType === 9 ? view.document.head : container
    if (!parent.querySelector('style[data-tsqd-styles]')) {
      const style = view.document.createElement('style')
      style.setAttribute('data-tsqd-styles', '')
      if (nonce) {
        style.setAttribute('nonce', nonce)
      }
      style.textContent = cssText
      parent.appendChild(style)
    }
    return
  }

  let sheet = sheets.get(view)
  if (!sheet) {
    sheet = new view.CSSStyleSheet()
    sheet.replaceSync(cssText)
    sheets.set(view, sheet)
  }

  if (!container.adoptedStyleSheets.includes(sheet)) {
    container.adoptedStyleSheets = [...container.adoptedStyleSheets, sheet]
  }
}
