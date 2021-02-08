import React, {PureComponent} from 'react';

import {InlineMath} from 'react-katex';

import {formatComplex} from '../util';


class CoordinateOverlay extends PureComponent {
    state = {
        faded: false
    }

    constructor(props) {
        super(props);

        this.fadeTimer = null;
        this.lastX = null;
        this.lastY = null;
    }

    hasChanged() {
        const {x, y} = this.props;
        const changed = (this.lastX !== x) || (this.lastY !== y);

        this.lastX = x;
        this.lastY = y;

        return changed;
    }

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate() {
        if (this.hasChanged()) {
            if (this.fadeTimer !== null) {
                clearTimeout(this.fadeTimer);
            }
            this.fadeTimer = setTimeout(() => this.setState({faded: true}), 2e3);
            this.setState({faded: false});
        }
    }

    render() {
        const {faded} = this.state;
        const {x, y, mapping} = this.props;

        const [u, v] = mapping([x, y]);

        return <div className='coordinate-container'>
            <InlineMath>{'z = ' + formatComplex(x, y, 3)}</InlineMath>
            {isFinite(u) && isFinite(v) ? <InlineMath>{'f(z) = ' + formatComplex(u, v, 3)}</InlineMath> : null}
            <style>{`
                .coordinate-container {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    z-index: 20;

                    padding: 5px 20px;
                    min-width: 180px;

                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;

                    background-color: hsla(213, 5%, 15%, 0.3);
                    border: 1px solid hsla(213, 5%, 90%, 0.1);
                    box-shadow: -1px -1px 4px hsla(213, 10%, 10%, 0.1);

                    border-radius: 8px 0 0 0;

                    backdrop-filter: blur(6px);

                    color: white;
                    font-size: 22px;
                    line-height: 1;

                    opacity: ${faded ? 0 : 1};
                    transition: ${faded ? 1 : 0.1}s opacity ease-out;
                }

                @media (max-width: 700px) {
                    .coordinate-container {
                        border-radius: 0;
                        left: 0;
                        font-size: 18px;
                    }
                }
            `}</style>
        </div>;
   }
}

export default CoordinateOverlay;
