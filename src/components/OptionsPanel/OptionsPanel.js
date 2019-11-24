import React from 'react';

import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';


class BooleanOption extends React.PureComponent {
  render() {
    const {onClick, checked, label} = this.props;
    return (
      <ListItem
	button
	onClick={onClick}
      >
	<Checkbox
	  checked={checked}
	/>
	<ListItemText>{label}</ListItemText>
      </ListItem>
    );
  }
}

class OptionsPanel extends React.PureComponent {
  renderOptions() {
    const options = [];
    for (const [variable, label] of Object.entries(this.props.options)) {
      options.push(
	<BooleanOption
	  key={variable}
	  onClick={() => this.props.onToggle(variable)}
	  checked={this.props.variables[variable] > 0.5}
	  label={label}
	/>
      );
    }
    return options;
  }

  render() {
    return (
      <List id='options-panel'>
	<ListSubheader disableSticky>{this.props.heading}</ListSubheader>
	{this.renderOptions()}
      </List>
    );
  }
}

export default OptionsPanel;
