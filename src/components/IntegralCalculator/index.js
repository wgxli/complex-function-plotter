import React, {PureComponent} from 'react';

import {isNil} from 'lodash';

import {pixelToPlot} from '../FunctionPlot';
import toJS from '../../gl-code/translators/to-js';

import ResultTooltip from './ResultTooltip';

import FreeformStrategy from './strategies/Freeform';
import ClosedFreeformStrategy from './strategies/FreeformClosed';
import CircleStrategy from './strategies/Circle';

const STRATEGY_DICT = {
    'freeform': FreeformStrategy,
    'freeform-closed': ClosedFreeformStrategy,
    'circle': CircleStrategy,
}

class IntegralCalculator extends PureComponent {
    state = {
        done: false,

        mouseDown: false,
        mousePosition: null,
        strategy: null,
    }

    constructor(props) {
        super(props);

        // Create canvas ref
        this.canvas = React.createRef();
    }

    resizeCanvas() {
        const canvas = this.canvas.current;
        const dpr = window.devicePixelRatio;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
    }


    // Re-initialized the state if dirty
    resetState() {
        const {done} = this.state;
        if (done) {
            this.setState({
                done: false,
                mousePosition: null,
                strategy: null,
           });
        }
    }

    handleMouseDown(e) {
        const {integrator, expression, variables, onClose} = this.props;
        const {done} = this.state;

        if (done) {
            // Close if already integrated once
            onClose();
        } else {
            // Compile plotted expression to JS
            const mapping = toJS(expression, variables);

            // Clear canvas
            this.resizeCanvas();
            const context = this.canvas.current.getContext('2d');
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);

            // Start integrating
            this.setState({
                mouseDown: true,
                strategy: new STRATEGY_DICT[integrator](
                    mapping, context, window.devicePixelRatio,
                ),
            });
        }
    }

    handleMouseMove(e) {
        const {strategy, mouseDown} = this.state;
        const {variables} = this.props;

        if (!mouseDown) {return;}

        const {clientX, clientY} = e;
        const [x, y] = pixelToPlot(clientX, clientY, variables);

        this.setState({mousePosition: [clientX, clientY]});

        if (!isNil(strategy)) {
            const dpr = window.devicePixelRatio;
            strategy.update({
                x, y,
                clientX: clientX * dpr,
                clientY: clientY * dpr,
            });
        }
    }

    handleMouseUp(e) {
        const {strategy} = this.state;

        // Notify integrator
        strategy.finish();

        // Set finished state
        this.setState({mouseDown: false, done: true});
    }

    render() {
        const {integrator} = this.props;
        const {done, mouseDown, mousePosition, strategy} = this.state;

        if (isNil(integrator)) {
            this.resetState();
            return null;
        }

        let tooltip = null;
        if (!(isNil(strategy) || isNil(mousePosition))) {
            const [x, y] = strategy.value();

            const snap = x => (Math.abs(x) < 1e-10 ? 0 : x);

            tooltip = <ResultTooltip
                x={snap(x)} y={snap(y)}
                style={{
                    position: 'absolute',
                    top: mousePosition[1],
                    left: mousePosition[0] - (window.innerWidth < 700 ? 80 : 0),
                    zIndex: 3,
                }}
            />;
        }


        return <div className='integral container'
            onMouseDown={this.handleMouseDown.bind(this)}
            onMouseMove={this.handleMouseMove.bind(this)}
            onMouseUp={this.handleMouseUp.bind(this)}

            onTouchStart={this.handleMouseDown.bind(this)}
            onTouchMove={e => this.handleMouseMove(e.touches[0])}
            onTouchEnd={this.handleMouseUp.bind(this)}
        >
            <canvas
                ref={this.canvas}
                className='canvas'
            />
            {tooltip}
            <p className='instructions'>
                Click and drag to draw a contour
            </p>
            <style>{`
                .integral.container {
                    position: absolute;

                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;

                    z-index: 15;
                    cursor: ${done ? 'default' : 'crosshair'};

                    overflow: hidden;

                    background-color: hsla(213, 10%, 10%, 0.6);

                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                }

                .integral canvas.canvas {
                    position: absolute;
                    top: 0;
                    left: 0;

                    width: 100%;
                    height: 100%;
                    
                    z-index: 1;
                }

                .integral .instructions {
                    color: hsl(213, 10%, 85%);
                    font-size: 20px;
                    text-align: center;

                    margin: 0;
                    display: ${mouseDown || done ? 'none' : 'block'};
                    z-index: 2;
                }
            `}</style>
        </div>;
    }
}

export default IntegralCalculator;
