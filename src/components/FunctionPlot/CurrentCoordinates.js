import React, {PureComponent} from 'react';

import 'katex/dist/katex.min.css';
import {InlineMath} from 'react-katex';

function formatComplex(x, y) {
    return formatReal(x, false) + formatReal(y, true) + '\\, i';
}

function formatReal(x, forceSign) {
    const magnitude = Math.abs(x);

    let exponent = magnitude > 0 ? Math.floor(Math.log10(magnitude)) : 0;
    if (Math.abs(exponent) < 3) {exponent = 0;}

    const mantissa = magnitude * Math.pow(10, -exponent);

    const formattedMagnitude = mantissa.toFixed(3);
    const formattedExponent = exponent === 0 ? '' : `\\times 10^{${exponent}}`;

    const sign = x < 0 ? '-' : (
        forceSign ? '+' : ''
    );

    return sign + formattedMagnitude + formattedExponent;
}

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
        const {x, y} = this.props;

        return <div className='container'>
            <InlineMath>{formatComplex(x, y)}</InlineMath>
            <style jsx>{`
                .container {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    z-index: 11;

                    padding: 5px 20px;
                    min-width: 180px;

                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;

                    background-color: hsla(213, 10%, 10%, 0.3);
                    border: 1px solid hsla(213, 10%, 0%, 0.1);
                    box-shadow: -1px -1px 4px hsla(213, 10%, 10%, 0.1);

                    border-radius: 8px 0 0 0;

                    backdrop-filter: blur(3px);

                    color: white;
                    font-size: 22px;
                    line-height: 1;

                    opacity: ${faded ? 0 : 1};
                    transition: ${faded ? 1 : 0.1}s opacity ease-out;
                }

                @media (max-width: 700px) {
                    .container {
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
