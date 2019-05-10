import React, {PureComponent} from 'react';


import BaseSlider from '@material-ui/lab/Slider';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';

import EditableValue from '../editable-value/EditableValue.js';

import './Slider.css';


class Slider extends PureComponent {
	constructor() {
		super();
		this.state = {
			min: 0,
			max: 1,
		}
	}

	setMin(value) {
		this.setState({min: value});

		// Clamp max to new min
		if (value > this.state.max) {this.setState({max: value});}

		// Clamp value to new min
		if (this.props.value < value) {this.props.onChange(value);}
	}

	setMax(value) {
		this.setState({max: value});

		// Clamp min to new max
		if (value < this.state.min) {this.setState({min: value});}

		// Clamp value to new max
		if (this.props.value > value) {this.props.onChange(value);}
	}

	setValue(value) {
		if (value < this.state.min) {this.setState({min: value});}
		if (value > this.state.max) {this.setState({max: value});}
		this.props.onChange(value);
	}
	handleSliderChange(e, value) {this.setValue(value);}

	// Clamp this.props.value between min and max.
	clamp() {
		const [min, max, value] = [this.state.min, this.state.max, this.props.value];
		if (value < min) {this.props.onChange(min);}
		if (value > max) {this.setState(max);}
	}

	render() {
		return (
			<div className='slider-base'>
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
								value={this.state.min}
								parser='number'
								onChange={this.setMin.bind(this)}
							/>
							<BaseSlider
								className='main-slider'
								min={this.state.min}
								max={this.state.max}
								value={this.props.value}
								onChange={this.handleSliderChange.bind(this)}
							/>
							<EditableValue
								name='upper-bound'
								value={this.state.max}
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
