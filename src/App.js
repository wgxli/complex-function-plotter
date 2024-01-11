import React from 'react';
import './App.css';
import 'katex/dist/katex.min.css';

import {ThemeProvider as MuiThemeProvider} from '@material-ui/core/styles';
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
  z += t;
  vec2 c = z;
  for (int i=0; i<64; i++) {
    z = cmul(z, z) + c;
  }
  return z;
}`;


function extractVariables(expression) {
    if (!Array.isArray(expression)) {return new Set();}
    if (expression[0] === 'variable' && expression[1] !== 'z') {
        return new Set([expression[1]]);
    }

    let output = new Set();
    for (let entry of expression) {
        output = new Set([...output, ...extractVariables(entry)]);
    }
    return output;
}


class App extends React.Component {
    state = {
        expressionText: 'z-t',
        expression: ['sub', ['variable', 'z'], ['variable', 't']],
        expressionError: false,
        typingTimer: null,

        customShader: defaultShader,
        shaderError: false,

        menuOpen: false,
        helpOpen: false,
        variableChanging: false,

        integrationStrategy: null,

        variables: {
            log_scale: 5,
            center_x: 0,
            center_y: 0,

            t: 0.3,

            enable_checkerboard: 1,
            invert_gradient: 0,
            continuous_gradient: 0,
            enable_axes: 1,

            custom_function: 0,
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
    handleVariableUpdate(update) {
        this.refs.plot.handleVariableUpdate(update);
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
        this.handleVariableUpdate({[name]: variables[name]});
        this.setState({variables});
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
            this.setExpression('z-t', true);
        } else {
            this.setExpression(decodeURIComponent(hash.slice(1)), true);
        }
    }

    setExpression(text, fromHash) {
        text = text.toLowerCase();

        window.history.replaceState(
            undefined, undefined,
            '#' + encodeURIComponent(text)
        );

        this.setState({
            expressionText: text,
            integrationStrategy: null,
        });

        if (fromHash) {
            const expression = parseExpression(text.trim());
            const variables = extractVariables(expression);
            const newVariables = {...this.state.variables};
            
            for (let entry of variables) {
                newVariables[entry] = 0.3;
            }

            this.setState({expression, variables: newVariables});
        } else {
            clearTimeout(this.typingTimer);
            this.typingTimer = setTimeout(this.finalizeExpression.bind(this), 200);
        }
    }

    finalizeExpression() {
        const {expressionText} = this.state;
        const expression = parseExpression(expressionText.trim());
        this.setState({expression});
    }

    setCustomShader(text) {
        this.setState({customShader: text});
    }

    renderFunctionEditor() {
        const {variables, customShader, shaderError} = this.state;
        if (variables.custom_function > 0.5) {
            return (
                <FunctionEditor
                    onChange={this.setCustomShader.bind(this)}
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
            variableChanging,
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
                        disabled={useCustomShader}
                    />
                    <SidePanel
                        className={`control-panel ${variableChanging ? 'changing' : ''}`}
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
                            setChanging={(x) => this.setState({variableChanging: x})}
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
                                enable_axes: 'Enable Axes',
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
                        <HelpText
                            setExpression={(expression) => {
                                this.setExpression(expression);
                                this.handleVariableUpdate({
                                    ...this.state.variables,
                                    custom_function: 0,
                                });
                            }}
                            closeMenu={() => this.setState({helpOpen: false})}
                        />
                    </SidePanel>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default App;
