export function isDOMNode(node) {
  return (
    node && Object.prototype.hasOwnProperty.call(node, 'getBoundingClientRect')
  )
}

export function parseOptions(options = {}) {
  return {
    root: options.root || null,
    rootMargin: parseRootMargin(options.rootMargin),
    threshold: parseThreshold(options.threshold)
  }
}

export function hasEqualOptions(observer, options) {
  return (
    equalPair(options.root, observer.root) &&
    equalPair(options.rootMargin, observer.rootMargin) &&
    equalPair(options.threshold, observer.thresholds)
  )
}

function parseRootMargin(rootMargin) {
  const margins = (rootMargin || '0px').trim().split(/\s+/)
  margins.forEach(validateRootMargin)
  margins[1] = margins[1] || margins[0]
  margins[2] = margins[2] || margins[0]
  margins[3] = margins[3] || margins[1]
  return margins.join(' ')
}

function validateRootMargin(margin) {
  if (!/^-?\d*\.?\d+(px|%)$/.test(margin)) {
    throw new Error('rootMargin must be specified as a CSS margin property')
  }
}

function parseThreshold(threshold) {
  return !Array.isArray(threshold)
    ? [typeof threshold !== 'undefined' ? threshold : 0]
    : threshold
}

function equalPair(optionA, optionB) {
  if (Array.isArray(optionA) && Array.isArray(optionB)) {
    if (optionA.length === optionB.length) {
      return optionA.every((element, idx) =>
        equalPair(optionA[idx], optionB[idx])
      )
    }
  }
  return optionA === optionB
}
