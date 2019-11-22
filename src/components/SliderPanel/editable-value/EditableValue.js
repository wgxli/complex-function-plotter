import React, {PureComponent} from 'react';
import ContentEditable from 'react-contenteditable';

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
    reset() {
        const propText = this.props.value.toString();
        if (propText !== this.state.text) {
            this.setState({text: this.props.value.toString()});
        }
    }


    /*** Event Handlers ***/
    componentDidMount() {
        // Exit on Enter keypress
        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && this.state.focused) {
                this.element.current.blur();
            }
        });
    }

    handleFocus(e) {
        this.setState({focused: true});
        this.reset();
    }

    handleChange(e) {
        this.setState({text: e.target.value.toString()});
    }

    handleBlur(e) {
        this.setState({focused: false});

        if (this.valid()) {
            this.props.onChange(this.parsedValue());
        }
    }

    componentDidUpdate() {if (!this.state.focused) {this.reset();}}

    render() {
        const classes = ['editable-value', this.props.name];

        if (this.state.focused) {
            classes.push('focus')
            if (!this.valid()) {
                classes.push('invalid')
            };
        }

        const classString = classes.join(' ');
        const current = this.element.current;
        if (current !== null) {
            this.element.current.setAttribute('class', classString);
        }

        const displayText = this.state.focused ? this.state.text : this.props.value.toString();

        if (this.props.disabled) {
            return (
                <span className={classString}>
                    {displayText}
                </span>
            );
        } else {
            return (
                <ContentEditable
                    html={displayText}

                    onFocus={this.handleFocus.bind(this)}
                    onChange={this.handleChange.bind(this)}
                    onBlur={this.handleBlur.bind(this)}

                    className={classString}

                    tagName='span'

                    innerRef={this.element}
                />
            );
        }
    }
}

export default EditableValue;
