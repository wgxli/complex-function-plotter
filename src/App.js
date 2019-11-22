import React from 'react';
import './App.css';

import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import theme from './theme.js';

import ControlBar from './components/ControlBar/ControlBar.js';
import FunctionPlot from './components/FunctionPlot/FunctionPlot.js';

import SidePanel from './components/SidePanel/SidePanel.js';

import './components/control-panel.css';
import SliderPanel from './components/SliderPanel/SliderPanel.js';
import OptionsPanel from './components/OptionsPanel/OptionsPanel.js';
import FunctionEditor from './components/FunctionEditor/FunctionEditor.js';

import HelpText from './components/HelpText/HelpText.js';


const defaultShader = `vec2 mapping(vec2 z) {
  vec2 c = z;
  for (int i=0; i<64; i++) {
    z = cmul(z, z) + c;
  }
  return z;
}`;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expression: 'z',
      expressionError: false,

      customShader: defaultShader,
      shaderError: false,

      menuOpen: false,
      helpOpen: false,

      variables: {
	log_scale: 5,
	center_x: 0,
	center_y: 0,
	t: 0.3,
	enable_checkerboard: 1,
	invert_gradient: 0,
	continuous_gradient: 0,
	antialiasing: 0,
	custom_function: 0
      }
    }
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleHashChange.bind(this));

    document.addEventListener(
      'gesturestart',
      (event) => this.preventDefault(event),
      {passive: false}
    );
    document.addEventListener(
      'touchmove',
      (event) => this.preventDefault(event),
      {passive: false}
    );

    this.handleHashChange();
  }

  preventDefault(event) {
    const tagName = event.target.tagName.toLowerCase();
    if (tagName === 'canvas') {
      event.preventDefault();
    } else {
      return event;
    }
  }


  // Toolbar buttons
  handleMenuButton() {
    this.setState({menuOpen: !this.state.menuOpen});
  }

  handleHelpButton() {
    this.setState({helpOpen: !this.state.helpOpen});
  }

  // Variable Sliders
  handleVariableUpdate(variables) {
    this.state.variables = variables;
    this.refs.plot.handleVariableUpdate(variables);
  }

  handleVariableAdd(name, value) {
    const variables = this.state.variables;
    variables[name] = value;
    this.setState({variables: variables});
  }

  handleVariableRemove(name) {
    const variables = this.state.variables;
    delete variables[name];
    this.setState({variables: variables});
  }

  handleOptionToggle(name) {
    const variables = this.state.variables;
    variables[name] = (variables[name] < 0.5) ? 1 : 0;
    this.setState({variables: variables});
  }

  setErrorMessage(message) {
    if (this.state.variables.custom_function > 0.5) {
      if (message !== this.state.shaderError) {
	this.setState({shaderError: message});
      }
    } else {
      if (message !== this.state.expressionError) {
	this.setState({expressionError: message});
      }
    }
  }

  handleHashChange(event) {
    const hash = window.location.hash;
    if (hash === '') {
      return;
    } else {
      this.setExpression(decodeURIComponent(hash.slice(1)));
    }
  }

  setExpression(text) {
    text = text.toLowerCase();

    window.history.replaceState(
      undefined, undefined,
      '#' + encodeURIComponent(text)
    );
    this.setState({expression: text});
  }

  setCustomShader(text) {
    this.setState({customShader: text});
  }

  renderFunctionEditor() {
    if (this.state.variables.custom_function > 0.5) {
      return (
	<FunctionEditor
	  onChange={(text) => this.setCustomShader(text)}
	  errorMessage={this.state.shaderError}
	  value={this.state.customShader}
	/>
      );
    } else {
      return; 
    }
  }

  render() {
    const expression = (this.state.variables.custom_function > 0.5) ? this.state.customShader : this.state.expression;

    return (
      <MuiThemeProvider theme={theme}>
	<div id='app'>
	  <ControlBar
	    menuOpen={this.state.menuOpen}
	    helpOpen={this.state.helpOpen}
	    onMenuButton={() => this.handleMenuButton()}
	    onHelpButton={() => this.handleHelpButton()}

	    onChange={(text) => this.setExpression(text)}
	    value={this.state.expression}
	    error={this.state.expressionError}
	  />
	  <SidePanel
	    className='control-panel'
	    open={this.state.menuOpen} 
	    onToggle={() => this.handleMenuButton()}
	    anchor='left'
	    transitionWidth={480}
	  >
	    <SliderPanel
	      variables={this.state.variables}
	      onUpdate={
		(variables) => this.handleVariableUpdate(variables)
	      }
	      onAdd={
		(name, value) => this.handleVariableAdd(name, value)
	      }
	      onRemove={
		(name) => this.handleVariableRemove(name)
	      }
	    />
	    <OptionsPanel
	      heading='Graphics Options'
	      options={{
		enable_checkerboard: 'Enable Checkerboard',
		invert_gradient: 'Invert Gradient',
		continuous_gradient: 'Continuous Gradient',
		antialiasing: 'Enable Antialiasing'
	      }}
	      onToggle={(name) => this.handleOptionToggle(name)}
	      variables={this.state.variables}
	    />
	    <OptionsPanel
	      heading='Advanced Options'
	      options={{
		custom_function: 'Custom Function'
	      }}
	      onToggle={(name) => this.handleOptionToggle(name)}
	      variables={this.state.variables}
	    />
	    {this.renderFunctionEditor()}
	  </SidePanel>
	  <FunctionPlot
	    ref='plot'
	    expression={expression}
	    variables={this.state.variables}
	    onError={(message) => this.setErrorMessage(message)}
	  />
	  <SidePanel
	    className='help-panel'
	    open={this.state.helpOpen}
	    anchor='right'
	    onToggle={() => this.handleHelpButton()}
	    transitionWidth={900}
	  >
	    <HelpText/>
	  </SidePanel>
	</div>
      </MuiThemeProvider>
    );
  }
}

export default App;
