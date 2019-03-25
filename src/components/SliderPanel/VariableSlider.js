import React from 'react';

import withStyles from '@material-ui/core/styles/withStyles';

import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import Slider from '@material-ui/lab/Slider';

import DeleteIcon from '@material-ui/icons/Delete';


const styles = theme => ({
  variableSlider: {
    paddingLeft: 0,
    paddingRight: 0
  }
});

class VariableSlider extends React.PureComponent {
  constructor(props) {
    super(props);
    this.classes = props.classes;
  }

  render() {
    return (
      <ListItem>
	<div className='variable-slider'>
	  <Typography variant='body2'>
	    {this.props.name + ' = ' + this.props.value.toFixed(3)}
	  </Typography>
	  <Slider
	    ref='slider'
	    classes={{root: this.classes.variableSlider}}
	    min={0}
	    max={1}
	    value={this.props.value}
	    onChange={this.props.onChange}
	  />
	</div>
	<ListItemSecondaryAction>
	  <IconButton
	    onClick={this.props.onDelete}
	  >
	    <DeleteIcon/>
	  </IconButton>
	</ListItemSecondaryAction>
      </ListItem>
    );
  }
}

export default withStyles(styles)(VariableSlider);
