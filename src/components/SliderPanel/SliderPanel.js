import React from 'react';

import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';

import VariableAdder from './VariableAdder.js';

import Slider from './slider/Slider.js';

import './slider-panel.css';


const hiddenVariables = new Set([
  'log_scale', 'center_x', 'center_y',

  'enable_checkerboard',
  'invert_gradient',
  'continuous_gradient',
  'enable_axes',

  'custom_function'
]);

class SliderPanel extends React.Component {
  constructor(props) {
    super(props);
    this.textField = React.createRef();
  }

  handleChange(name, value) {
    this.props.variables[name] = value;
    this.props.onUpdate({[name]: value});
    this.forceUpdate();
  }

  renderSliderList() {
    const {variables} = this.props;
    let sliderList = [];
    for (const [name, value] of Object.entries(variables)) {
      // Skip variables in hidden blacklist
      if (hiddenVariables.has(name)) {continue;}

      // Return slider component
      sliderList.push(
	<Slider 
	  key={name}
	  name={name}
	  value={value}
	  onChange={(value) => this.handleChange(name, value)}
	  onDelete={() => this.props.onRemove(name)}
	/>
      );
    }

    return sliderList;
  }

  render() {
    return (
      <List id='variable-list'>
	<ListSubheader disableSticky>Variables</ListSubheader>
	{this.renderSliderList()}
	<VariableAdder
	  onClick={name => this.props.onAdd(name, 0.5)}
	/>
      </List>
    );
  }
}

export default SliderPanel;
