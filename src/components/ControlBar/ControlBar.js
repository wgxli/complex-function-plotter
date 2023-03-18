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
      const {disabled, onMenuButton, onHelpButton, error, value} = this.props;
      return (
        <AppBar id='app-bar'>
          <Toolbar disableGutters>
            <IconButton
              onClick={onMenuButton}
            >
              <MenuIcon/>
            </IconButton>
            <div id='function-input'>
              <TextField
                  id='function-input'
                  placeholder={window.innerWidth > 480 ? 'Enter a complex function of z' : 'f(z)'}
                  value={value}
                  onChange={(event) => this.handleTextChange(event)}
                  error={error}
                  autoFocus
                  fullWidth
                  disabled={disabled}
              />
            </div>
            <div id='help-button'>
                <Button onClick={onHelpButton}>Help</Button>
            </div>
          </Toolbar>
        </AppBar>
      );
  }
}

export default ControlPanel;
