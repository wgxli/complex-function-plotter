import React, { PureComponent } from 'react';
import { css } from '@emotion/css';


import BaseSlider from '@material-ui/core/Slider';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';

import PlayIcon from '@material-ui/icons/PlayArrow';
import BounceIcon from '@material-ui/icons/SyncAlt';
import LoopIcon from '@material-ui/icons/ArrowRightAlt';

import EditableValue from '../editable-value/EditableValue.js';

import './Slider.css';

const SPEEDS = [
    0.2,
    0.5,
    1,
    2,
    3,
    4
];

function AnimationMode({mode, speed, onChangeMode, onChangeSpeed}) {
    const nextMode = {
        '': 'bounce',
        'bounce': 'loop',
        'loop': '',
    };
    const icons = {
        '': PlayIcon,
        'bounce': BounceIcon, 
        'loop': LoopIcon,
    }
    const Icon = icons[mode];

    return <div className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
    `}>
        <Icon className={css`
            color: ${mode === '' ? 'hsl(200, 10%, 80%)' : 'hsl(200, 60%, 50%)'};
            cursor: pointer;
        `}
        onClick={() => {
            const newMode = nextMode[mode];
            onChangeMode(newMode) ;
        }}/>
        <span
            onClick={() => {
                onChangeSpeed((speed + 1) % SPEEDS.length);
            }}
            className={css`
                font-size: 15px;
                color: hsl(200, 20%, 40%);
                cursor: pointer;
                font-family: 'KaTeX_Main';
                user-select: none;

                @media (max-width: 480px) {
                  font-size: 14px;
                }
            `}
        >
            {SPEEDS[speed].toFixed(1)}×
        </span>
    </div>;
}


class Slider extends PureComponent {
    state = {
        min: 0,
        max: 1,
        animationMode: '',
        animationSpeed: 2,
        animationCurrentDirection: 1,
        changing: false,
    };
    deleted = false;


    setMin(min) {
        const {value, onChange} = this.props;
        this.setState({min});
        if (value < min) {onChange(min);}
    }

    setMax(max) {
        const {value, onChange} = this.props;
        this.setState({max});
        if (value > max) {onChange(max);}
    }

    setValue(value) {
        this.ensureConsistency();
        this.props.onChange(value);
    }

    // Adjust this.state.min and this.state.max
    // if this.props.value is out of bounds.
    ensureConsistency() {
        const [min, max, value] = [this.state.min, this.state.max, this.props.value];
        if (min > value) {this.setState({min: value});}
        if (max < value) {this.setState({max: value});}
    }

    runAnimationTick(timestamp) {
        const {onChange, value} = this.props;
        const {
            min, max,
            animationMode, animationCurrentDirection, animationSpeed
        } = this.state;

        if (this.deleted) {return;}

        let dt = 0;
        if (timestamp !== undefined && this.lastAnimationTick !== undefined) {
            dt = timestamp - this.lastAnimationTick;
        }
        this.lastAnimationTick = timestamp;

        const delta = (max - min) * SPEEDS[animationSpeed] * animationCurrentDirection * dt/4e3;
        let newValue = value + delta;

        if (animationMode === 'bounce') {
            if (newValue > max) {
                newValue = max;
                this.setState({animationCurrentDirection: -1});
            }
            if (newValue < min) {
                newValue = min;
                this.setState({animationCurrentDirection: 1});
            }
        }

        if (animationMode === 'loop') {
            if (newValue > max) {newValue = min;}
        }

        const digits = Math.max(-Math.floor(Math.log10(max-min))+3, 3);
        const scale = Math.pow(10, digits);
        onChange(Math.round(scale * newValue)/scale);

        if (animationMode === '') {return;}
        if (this._mounted) {
          requestAnimationFrame(this.runAnimationTick.bind(this));
        }
    }

    componentDidMount() {
        this.ensureConsistency();
        this._mounted = true;
    }

    componentWillUnmount() {
        this._mounted = false;
        this.props.setChanging(false);
    }

    handleCommit() {
        this.setState({changing: false});
        this.props.setChanging(this.state.animationMode !== '');
    }

    render() {
        const {min, max, animationMode, animationSpeed, changing} = this.state;
        return (
            <div className={`slider-wrapper ${css`
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 5px 0;
                margin: 8px 4px;
                padding-left: 10px;
                background-color: white;
                border-radius: 8px;
                `}`}
                onMouseUp={this.handleCommit.bind(this)}
                onTouchEnd={this.handleCommit.bind(this)}
             >
                <AnimationMode
                    mode={animationMode}
                    speed={animationSpeed}
                    onChangeMode={
                        (mode) => {
                            this.state.animationMode = mode; // To avoid race conditions
                            this.setState({animationMode: mode, animationCurrentDirection: 1});
                            this.runAnimationTick();
                            this.props.setChanging(mode !== '');
                        }
                    }
                    onChangeSpeed={
                        (speed) => {
                            this.setState({animationSpeed: speed});
                        }
                    }
                />
                <div className='slider'>
                    <div className='info-row'>
                        <EditableValue
                            name={'name' + (this.props.name.length === 1 ? '-italic' : '')}
                            value={this.props.name}
                            parser='lower'
                            onChange={this.props.onNameChange}
                            disabled
                        />
                        <span>=</span>
                        <EditableValue
                            name='value'
                            value={this.props.value}
                            parser='number'
                            onChange={this.setValue.bind(this)}
                        />
                    </div>
                    <div className='main-row'>
                        <EditableValue
                            name='lower-bound'
                            value={min}
                            parser='number'
                            onChange={this.setMin.bind(this)}
                        />
                        <BaseSlider
                            className='main-slider'
                            min={min}
                            max={max}
                            value={this.props.value}
                            step={(max - min)/1e3}
                            onChange={(e, v) => {
                                if (!this.state.changing) {this.props.setChanging(true);}
                                this.state.changing = true;
                                this.setValue(v);
                            }}
                        />
                        <EditableValue
                            name='upper-bound'
                            value={max}
                            parser='number'
                            onChange={this.setMax.bind(this)}
                        />
                    </div>
                </div>
                <IconButton onClick={() => {
                    this.deleted = true;
                    this.props.onDelete();
                }} className='delete-icon'>
                    <DeleteIcon/>
                </IconButton>
            </div>
        );
    }
}

export default Slider;
