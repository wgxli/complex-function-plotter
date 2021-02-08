import React from 'react';
import { css } from '@emotion/css';

import functionList from '../../gl-code/function-list.js';

import ListItem from '@material-ui/core/ListItem';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';


const blacklist = functionList;

class VariableAdder extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            errorMessage: ''
        };
    }

    setValue(value) {
        this.setState({value: value, errorMessage: ''});
    }

    handleKeyPress(event) {
        if (event.keyCode === 13) {
            this.handleClick();
        }
    }

    handleClick() {
        const name = this.state.value.toLowerCase();
        if (name === '') {
            this.setState({errorMessage: 'Must be nonempty'});
        } else if (name.match(/^[a-z]+$/) === null) {
            this.setState({errorMessage: 'Letters only'});
        } else if (blacklist.has(name)) {
            this.setState({errorMessage: 'Restricted keyword'});
        } else {
            this.setValue('');
            this.props.onClick(name);
        }
    }

    render() {
        return (
            <ListItem className={css`
                margin-left: 10px;
                width: 100%;
            `}>
                <TextField
                    placeholder='Name'
                    onChange={event => this.setValue(event.target.value)}
                    onKeyDown={(event) => this.handleKeyPress(event)}
                    error={this.state.errorMessage !== ''}
                    helperText={this.state.errorMessage}
                    value={this.state.value}
                    className={css`
                        flex-grow: 1;
                    `}
                />
                <Button
                    onClick={() => this.handleClick()}
                >Add</Button>
            </ListItem>
        );
    }
}

export default VariableAdder;
