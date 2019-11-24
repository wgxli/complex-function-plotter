import React from 'react';
import './App.css';
import 'katex/dist/katex.min.css';

import {isNil} from 'lodash';

import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import theme from './theme.js';

import ControlBar from './components/ControlBar/ControlBar.js';
import FunctionPlot from './components/FunctionPlot';

import SidePanel from './components/SidePanel/SidePanel.js';
import './components/control-panel.css';

import SliderPanel from './components/SliderPanel/SliderPanel.js';
import OptionsPanel from './components/OptionsPanel/OptionsPanel.js';

import IntegralCalculator from './components/IntegralCalculator';
import IntegralPanel from './components/IntegralCalculator/IntegralPanel';

import FunctionEditor from './components/FunctionEditor/FunctionEditor.js';

import HelpText from './components/HelpText/HelpText.js';

import {parseExpression} from './gl-code/complex-functions';


const defaultShader = `vec2 mapping(vec2 z) {
  vec2 c = z;
  for (int i=0; i<64; i++) {
    z = cmul(z, z) + c;
  }
  return z;
}`;

class App extends React.Component {
  state = {
    expressionText: 'z',
    expression: ['variable', 'z'],
    expressionError: false,

    customShader: defaultShader,
    shaderError: false,

    menuOpen: false,
    helpOpen: false,

    integrationStrategy: null,

    variables: {
      log_scale: 5,
      center_x: 0,
      center_y: 0,
      t: 0.3,
      enable_checkerboard: 1,
      invert_gradient: 0,
      continuous_gradient: 0,
      custom_function: 0,
      enable_supersampling: (window.innerWidth > 800) ? 1 : 0,
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
    const {variables, expressionError, shaderError} = this.state;

    if (variables.custom_function > 0.5) {
      if (message !== shaderError) {
	this.setState({shaderError: message});
      }
    } else {
      if (message !== expressionError) {
	this.setState({expressionError: message});
      }
    }
  }

  handleHashChange() {
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

    this.setState({
        expressionText: text,
        expression: parseExpression(text),
        integrationStrategy: null,
    });
  }

  setCustomShader(text) {
    this.setState({customShader: text});
  }

  renderFunctionEditor() {
    const {variables, customShader, shaderError} = this.state;
    if (variables.custom_function > 0.5) {
      return (
	<FunctionEditor
	  onChange={this.setCustomShader}
	  errorMessage={shaderError}
	  value={customShader}
	/>
      );
    } else {
      return; 
    }
  }

  render() {
    const {
        variables,
        customShader,
        expression, expressionText,
        menuOpen, helpOpen,
        expressionError,
        integrationStrategy,
    } = this.state;

    const useCustomShader = variables.custom_function > 0.5;

    const ast = useCustomShader ? customShader : expression;

    return (
      <MuiThemeProvider theme={theme}>
	<div id='app'>
	  <ControlBar
	    menuOpen={menuOpen}
	    helpOpen={helpOpen}
	    onMenuButton={this.handleMenuButton.bind(this)}
	    onHelpButton={this.handleHelpButton.bind(this)}

	    onChange={this.setExpression.bind(this)}
	    value={expressionText}
	    error={expressionError}
	  />
	  <SidePanel
	    className='control-panel'
	    open={menuOpen} 
	    onToggle={this.handleMenuButton.bind(this)}
	    anchor='left'
	    transitionWidth={480}
	  >
	    <SliderPanel
	      variables={variables}
	      onUpdate={this.handleVariableUpdate.bind(this)}
	      onAdd={this.handleVariableAdd.bind(this)}
	      onRemove={this.handleVariableRemove.bind(this)}
	    />
            <IntegralPanel
              variables={variables}
              hidePanels={() => this.setState({helpOpen: false, menuOpen: false})}
              openCalculator={integrationStrategy => this.setState({integrationStrategy})}
            />
	    <OptionsPanel
	      heading='Graphics Options'
	      options={{
		enable_checkerboard: 'Enable Checkerboard',
		invert_gradient: 'Invert Gradient',
		continuous_gradient: 'Continuous Gradient',
	      }}
	      onToggle={this.handleOptionToggle.bind(this)}
	      variables={variables}
	    />
	    <OptionsPanel
	      heading='Advanced Options'
	      options={{
		custom_function: 'Custom Function'
	      }}
	      onToggle={this.handleOptionToggle.bind(this)}
	      variables={variables}
	    />
	    {this.renderFunctionEditor()}
	  </SidePanel>
          <IntegralCalculator
              expression={ast}
              variables={variables}
              integrator={integrationStrategy}
              onClose={() => this.setState({integrationStrategy: null})}
          />
	  <FunctionPlot
	    ref='plot'
	    expression={ast}
	    variables={variables}
	    onError={this.setErrorMessage.bind(this)}
	  />
	  <SidePanel
	    className='help-panel'
	    open={helpOpen}
	    anchor='right'
	    onToggle={this.handleHelpButton.bind(this)}
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
