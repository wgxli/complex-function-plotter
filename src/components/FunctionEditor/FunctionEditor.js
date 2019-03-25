import React from 'react';

import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';

import './function-editor.css';


class FunctionEditor extends React.PureComponent {
  handleChange(event) {
    this.props.onChange(event.target.value);
  }

  render() {
    return (
      <div id='function-editor'>
	<Typography variant='caption'>
	  Please read the “Advanced Features” documentation in the right pane before proceeding!
	</Typography>
	<TextField
	  fullWidth
	  multiline
	  placeholder='vec2 mapping(vec2 z)'
	  error={this.props.errorMessage}
	  onChange={(event) => this.handleChange(event)}
	  defaultValue={this.props.value}
	/>
      </div>
    );
  }
}

export default FunctionEditor;
