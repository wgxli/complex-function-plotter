import React from 'react';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';

import MenuIcon from '@material-ui/icons/Menu';

import './control-bar.css';


class ControlPanel extends React.PureComponent {
  handleTextChange(event) {
    this.props.onChange(event.target.value);
  }

  render() {
    return (
      <AppBar id='app-bar'>
	<Toolbar disableGutters>
	  <IconButton
	    onClick={this.props.onMenuButton}
	  >
	    <MenuIcon/>
	  </IconButton>
	  <div id='function-input'>
	    <TextField
	      id='function-input'
	      placeholder='Enter a complex function of z'
	      value={this.props.value}
	      onChange={(event) => this.handleTextChange(event)}
	      error={this.props.error}
	      autoFocus
	      fullWidth
	    />
	  </div>
	  <div id='help-button'>
	    <Button
	      onClick={this.props.onHelpButton}
	    >
	      Help
	    </Button>
	  </div>
	</Toolbar>
      </AppBar>
    );
  }
}

export default ControlPanel;
