import React from 'react';

import withStyles from '@material-ui/core/styles/withStyles';

import Drawer from '@material-ui/core/Drawer';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';

import './side-panel.css';


const styles = theme => ({
  toolbar: theme.mixins.toolbar
});

class SidePanel extends React.PureComponent {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    this.state = {
      width: null
    }
  }
  
  componentDidMount() {
    this.updateWidth();
    window.addEventListener('resize', this.updateWidth.bind(this));
  }

  updateWidth() {
    this.setState({width: window.innerWidth});
  }

  render() {
    if (this.state.width > this.props.transitionWidth) {
      return (
	<Drawer
	  anchor={this.props.anchor}
	  open={this.props.open}
	  variant='persistent'
	  classes={{
	    paper: this.props.className
	  }}
	>
	  <div className={this.classes.toolbar}/>
	  <div className='drawer-content'>
	    {this.props.children}
	  </div>
	</Drawer>
      );
    } else {
      return (
	<SwipeableDrawer
	  anchor={this.props.anchor}
	  open={this.props.open}
	  onOpen={this.props.onToggle}
	  onClose={this.props.onToggle}
	  classes={{
	    paper: this.props.className
	  }}
	  disableDiscovery
	  disableSwipeToOpen
	>
	  <div className='drawer-content'>
	    {this.props.children}
	  </div>
	</SwipeableDrawer>
      );
    }
  }
}

export default withStyles(styles)(SidePanel);
