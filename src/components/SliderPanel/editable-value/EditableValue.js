import React, {PureComponent} from 'react';

import DEFAULT_PARSERS from './parsers.js';
import './EditableValue.css';


class EditableValue extends PureComponent {
	constructor() {
		super();
		this.state = {
			focused: false,
			text: ''
		};
		this.element = React.createRef();
	}

	/*** Value Parsing ***/
	getParser() {
		if (this.props.parser in DEFAULT_PARSERS) {
			return DEFAULT_PARSERS[this.props.parser];
		} else {
			return this.props.parser;
		}
	}

	parsedValue() {
		return this.getParser()(this.state.text);
	}

	valid() {
		return this.parsedValue() !== undefined;
	}

	// Resets this.state.text to match this.props.value
	reset() {this.setText(this.props.value);}


	/*** Event Handlers ***/
	componentDidMount() {
		this.reset();

		const current = this.element.current;
		if (current !== null) {
			// Exit on Enter keypress
			document.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {current.blur();}
			});

		}
	}

	// Resize to fit text
	setText(text) {
		const current = this.element.current;
		text = text.toString();
		
		if (current !== null) {
			const style = window.getComputedStyle(current, null);
			const fontSize = parseFloat(style.getPropertyValue('font-size'));

			const textWidth = fontSize * text.length * 0.6;
			console.log(text.length);
			current.style.width = `${textWidth}px`;
		}

		this.setState({text: text});
	}

	handleFocus(e) {
		this.setState({focused: true});
		this.reset();
	}

	handleChange(e) {
		this.setText(e.target.value);
	}

	handleBlur(e) {
		this.setState({focused: false});

		if (this.valid()) {
			this.props.onChange(this.parsedValue());
		} else {
			this.reset();
		}
	}

	render() {
		const classes = ['editable-value', this.props.name];

		if (this.state.focused) {classes.push('focus')};
		if (!this.valid()) {classes.push('invalid')};

		if (!this.state.focused) {this.reset();}

		const classString = classes.join(' ');

		if (this.props.disabled) {
			return (
				<span
					type='text'
					className={classString}
				>
					{this.state.text}
				</span>
			);
		} else {
			return (
				<input
					type='text'
					value={this.state.text}

					onFocus={this.handleFocus.bind(this)}
					onChange={this.handleChange.bind(this)}
					onBlur={this.handleBlur.bind(this)}

					className={classString}

					ref={this.element}
				/>
			);
		}
	}
}

export default EditableValue;
