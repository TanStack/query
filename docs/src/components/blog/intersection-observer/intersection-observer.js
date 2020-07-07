// Packages
import { Component, cloneElement, Children } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';

// Private Observer Manager functions and manager
import { getObserver, observeTarget, unobserveTarget } from './manager';
import { hasEqualOptions, isDOMNode } from './utils';

export default class Observer extends Component {
  static propTypes = {
    disabled: PropTypes.bool,
    once: PropTypes.bool,
    onIntersect: PropTypes.func.isRequired,
    render: PropTypes.func,
    root: PropTypes.element,
    rootMargin: PropTypes.string,
    threshold: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.number),
      PropTypes.number,
    ]),
    value: PropTypes.string,
  };

  static defaultProps = {
    disabled: false,
    once: false,
  };

  shouldReobserve = false;

  componentDidMount() {
    this.observer = getObserver(getOptions(this.props));
    this.observe();
  }

  componentDidUpdate(prevProps) {
    const nextOptions = getOptions(this.props);
    if (!hasEqualOptions(this.observer, nextOptions)) {
      this.unobserve();
      this.observer = getObserver(nextOptions);
      this.shouldReobserve = true;
    }

    if (prevProps.disabled && !this.props.disabled) {
      this.shouldReobserve = true;
    }

    if (!prevProps.disabled && this.props.disabled) {
      this.unobserve();
    }

    if (this.shouldReobserve) {
      this.observe();
      this.shouldReobserve = false;
    }
  }

  componentWillUnmount() {
    this.unobserve();
  }

  handleTarget = (node) => {
    // eslint-disable-next-line
    const element = isDOMNode(node) ? node : findDOMNode(node);
    if (this.target && this.target !== element) {
      this.unobserve();
      this.shouldReobserve = true;
    }
    this.target = element;
  };

  observe() {
    if (!this.props.disabled && this.target) {
      observeTarget(this.observer, this.target, this.handleIntersect);
    }
  }

  unobserve() {
    if (this.target) {
      unobserveTarget(this.observer, this.target);
    }
  }

  handleIntersect = (entry) => {
    this.props.onIntersect(entry, this.props.value);
    if (this.props.once && entry.isIntersecting) {
      this.unobserve();
    }
  };

  render() {
    return this.props.render
      ? this.props.render({ innerRef: this.handleTarget })
      : cloneElement(Children.only(this.props.children), {
          ref: this.handleTarget,
        });
  }
}

const getOptions = (props) => ({
  root: props.root,
  rootMargin: props.rootMargin,
  threshold: props.threshold,
});
