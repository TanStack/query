import React, { Component } from 'react';
import IObserver from './intersection-observer';
import cn from 'classnames';

// import VideoComponent from '../styleguide/video';

// This component might look a little complex
// because one could argue that keeping the aspect ratio
// of an image can be solved with `height: auto`,
// but it's actually not that easy if you want to prevent
// element flickering

// Because if you want to do that, you need to set the aspect
// ratio of the image's container BEFORE the image loads

class Image extends Component {
  constructor(props) {
    super(props);
  }

  static defaultProps = {
    lazy: true,
  };

  state = {
    src: !this.props.lazy ? this.props.videoSrc || this.props.src : undefined,
  };

  handleIntersect = (entry) => {
    if (entry.isIntersecting) {
      console.log('intersected');
      this.setState({ src: this.props.src });
    }
  };

  onLoad = () => {
    console.log('loaded');
    this.setState({
      loaded: true,
    });
  };

  render() {
    const {
      caption,
      height: origHeight,
      lazy,
      margin = 40,
      video = false,
      videoSrc,
      width: origWidth,
      captionSpacing = null,
      oversize = true,
      borderRadius = false,
      alt,
      imageProps,
      className,
      children,
      ...props
    } = this.props;
    const height = parseInt(origHeight);
    const width = parseInt(origWidth);

    const aspectRatio = String((height / width) * 100) + '%';

    // if (video || videoSrc) {
    //   return <VideoComponent src={videoSrc} {...this.props} />;
    // }

    let src = this.state.src;

    // if (src && src.indexOf('assets.zeit.co') > -1) {
    //   if (src.indexOf('/q_auto') === -1) {
    //     src = src.replace('upload/', 'upload/q_auto/');
    //   }
    // }

    return (
      <IObserver
        once
        onIntersect={this.handleIntersect}
        rootMargin="20%"
        disabled={!lazy}
      >
        <figure
          className={cn(className, {
            oversize: width > 650 && oversize,
            fadeIn: this.state.loaded,
          })}
          {...props}
        >
          <main style={{ width }}>
            <div className="container" style={{ paddingBottom: aspectRatio }}>
              {src ? (
                <img
                  decoding="async"
                  loading="lazy"
                  src={src || null}
                  onLoad={this.onLoad}
                  alt={alt}
                  {...imageProps}
                />
              ) : (
                children
              )}
            </div>

            {caption && (
              <p style={captionSpacing ? { marginTop: captionSpacing } : {}}>
                {caption}
              </p>
            )}
          </main>

          <style jsx>{`
            figure {
              display: block;
              text-align: center;
              margin: ${margin}px 0;
            }

            figure.fadeIn {
              animation: fade-in 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955)
                forwards;
            }

            figure.fadeIn img {
              display: block;
            }

            @keyframes fade-in {
              from {
                /* Don't begin with 0, it gives a feeling of flickering. */
                opacity: 0.3;
              }
              to {
                opacity: 1;
              }
            }

            main {
              margin: 0 auto;
              max-width: 100%;
            }

            div {
              position: relative;
            }

            img {
              display: none;
              height: 100%;
              left: 0;
              position: absolute;
              top: 0;
              width: 100%;
              ${borderRadius ? `border-radius: var(--geist-radius);` : ''};
            }

            .container {
              display: flex;
              justify-content: center;
            }

            p {
              color: var(--accents-5);
              font-size: 14px;
              margin: 10px 0 0 0;
              text-align: center;
            }

            @media (min-width: 992px) {
              figure.oversize {
                width: ${width}px;
                margin: ${margin}px 0 ${margin}px
                  calc(((${width}px - 768px) / 2) * -1);
              }

              p {
                margin: 0;
              }
            }
          `}</style>
        </figure>
      </IObserver>
    );
  }
}

// export const Video = (props) => <Image {...props} video />;

export default Image;
