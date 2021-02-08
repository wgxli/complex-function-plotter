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


function AnimationMode({mode, onChange}) {
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

    return <div onClick={() => {
        const newMode = nextMode[mode];
        onChange(newMode, 1) ;
    }}>
        <Icon className={css`
            color: ${mode === '' ? 'hsl(200, 10%, 80%)' : 'hsl(200, 60%, 50%)'};
            margin-right: 10px;
        `}/>
    </div>;
}


class Slider extends PureComponent {
    constructor() {
        super();
        this.state = {
            min: 0,
            max: 1,
            animationMode: '',
            animationSpeed: 0,
        };
    }

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
        const {min, max, animationMode, animationSpeed} = this.state;

        let dt = 0;
        if (timestamp !== undefined && this.lastAnimationTick !== undefined) {
            dt = timestamp - this.lastAnimationTick;
        }
        this.lastAnimationTick = timestamp;

        const delta = (max - min) * animationSpeed * dt/4e3;
        let newValue = value + delta;

        if (animationMode === 'bounce') {
            if (newValue > max) {
                newValue = max;
                this.setState({animationSpeed: -1});
            }
            if (newValue < min) {
                newValue = min;
                this.setState({animationSpeed: 1});
            }
        }

        if (animationMode === 'loop') {
            if (newValue > max) {newValue = min;}
        }

        onChange(Math.round(1e3 * newValue)/1e3);

        if (animationMode === '') {return;}
        requestAnimationFrame(this.runAnimationTick.bind(this));
    }

    componentDidMount() {
        this.ensureConsistency();
    }

    render() {
        const {min, max} = this.state;
        return (
            <div className='slider-base' className={css`
                display: flex;
                flex-direction: row;
                align-items: center;
                margin: 10px 0;
                margin-left: 10px;
            `}>
                <AnimationMode mode={
                    this.state.animationMode
                } onChange={
                    (mode, speed) => {
                        this.state.animationMode = mode;
                        this.state.animationSpeed = speed;
                        this.setState({animationMode: mode, animationSpeed: speed});
                        this.runAnimationTick();
                    }
                }/>
                <div className='slider'>
                    <div className='info-row'>
                        <EditableValue
                            name='name'
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
                            onChange={(e, v) => this.setValue(v)}
                        />
                        <EditableValue
                            name='upper-bound'
                            value={max}
                            parser='number'
                            onChange={this.setMax.bind(this)}
                        />
                    </div>
                </div>
                <IconButton onClick={this.props.onDelete} className='delete-icon'>
                    <DeleteIcon/>
                </IconButton>
            </div>
        );
    }
}

export default Slider;
