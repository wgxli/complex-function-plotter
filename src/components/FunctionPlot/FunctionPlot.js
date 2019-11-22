import React, {PureComponent} from 'react';

import {isNil} from 'lodash';

import {initializeScene, drawScene} from '../../gl-code/scene.js';
import {toJS} from '../../gl-code/translators';

import CoordinateOverlay from './CoordinateOverlay';

import './function-plot.css';


const FPS_LIMIT = 60;

class FunctionPlot extends PureComponent {
  state = {
      position: [NaN, NaN, 0],
      mouseDown: false,
  }

  constructor(props) {
    super(props);

    this.gl = null;

    this.variables = this.props.variables;
    this.variableLocations = {};
    this.initialized = false;

    this.canvasSize = [];

    this.lastUpdate = null; // Timestamp of last update, for debouncing

    this.jsExpression = null; // Currently plotted expression as a JS object
  }

  componentDidMount() {
    window.addEventListener('resize', this.compilePlot.bind(this));

    this.initializeWebGL();
    this.componentDidUpdate();
    this.compilePlot();
  }

  // Perform a full update of the plot (expensive!)
  compilePlot() {
    const {onError} = this.props;
    this.initializePlot();
    this.updatePlot();
    onError(!this.initialized);
  }
  
  componentDidUpdate() {
      const {position, mouseDown} = this.state;

      // Only do a full update if something other than mouse position/state has changed
      if (this.lastPosition === position && this.lastMouseDown === mouseDown) {
          this.compilePlot();
      }

      this.lastPosition = position;
      this.lastMouseDown = mouseDown;
  }

  pixelToPlot(x, y) {
    const scale = Math.exp(this.variables.log_scale);
    const offset_x = this.variables.center_x;
    const offset_y = this.variables.center_y;

    const plot_x = (x - this.canvasSize[0]/2) / scale + offset_x;
    const plot_y = (this.canvasSize[1]/2 - y) / scale + offset_y;
    return [plot_x, plot_y];
  }

  plotToPixel(plot_x, plot_y) {
    const scale = Math.exp(this.variables.log_scale);
    const offset_x = this.variables.center_x;
    const offset_y = this.variables.center_y;

    const x = scale * (plot_x - offset_x) + this.canvasSize[0]/2;
    const y = -scale * (plot_y - offset_y) - this.canvasSize[1]/2;
    return [x, y];
  }

  getPosition(mouseEvent) {
    const nativeEvent = mouseEvent.nativeEvent;
    
    if (nativeEvent.targetTouches !== undefined) {
      const touches = nativeEvent.targetTouches;
      if (touches.length === 1) {
	return [touches[0].pageX, touches[0].pageY, 1];
      } else {
	const [x0, y0] = [touches[0].pageX, touches[0].pageY];
	const [x1, y1] = [touches[1].pageX, touches[1].pageY];

	const centerX = (x0 + x1) / 2;
	const centerY = (y0 + y1) / 2;
	const logDistance = Math.log(Math.hypot(x1-x0, y1-y0));
	return [centerX, centerY, logDistance];
      }
    } else {
      return [nativeEvent.pageX, nativeEvent.pageY, 1];
    }
  }

  updatePosition(mouseEvent) {
      this.setState({position: this.getPosition(mouseEvent)});
  }

  handleZoom(wheelEvent, deltaLogScale) {
    const {position} = this.state;

    if (position.some(isNaN)) {return;}

    // Recenter plot at scroll location
    const [mouse_plotx, mouse_ploty] = this.pixelToPlot(...position);
    this.variables.center_x = mouse_plotx;
    this.variables.center_y = mouse_ploty;
    
    // Change scale
    if (deltaLogScale === undefined) {
      deltaLogScale = (wheelEvent.deltaY > 0) ? -0.05: 0.05;
    }
    this.variables.log_scale += deltaLogScale;

    // Move center back onto mouse
    const [new_mouse_plotx, new_mouse_ploty] = this.pixelToPlot(...position);
    const [x_shift, y_shift] = [new_mouse_plotx - mouse_plotx, new_mouse_ploty - mouse_ploty];
    this.variables.center_x -= x_shift;
    this.variables.center_y -= y_shift;

    this.updatePlot();
  }

  handleMouseDown(event) {
    this.updatePosition(event);
    this.setState({mouseDown: true});
  }

  handleMouseUp(event) {
    this.setState({mouseDown: false});
  }

  handleMouseMove(event) {
    const {mouseDown} = this.state;

    // Handle dragging of plot
    if (mouseDown) {
      const {position} = this.state;
      const [x, y, logDistance] = this.getPosition(event);

      const deltaPosition = [
	x - position[0],
	y - position[1],
	logDistance - position[2]
      ];

      const scale = Math.exp(this.variables.log_scale);
      this.variables.center_x -= deltaPosition[0] / scale;
      this.variables.center_y += deltaPosition[1] / scale;
      this.handleZoom(null, deltaPosition[2]);
      this.updatePlot();
    }
    this.updatePosition(event);
  }

  handleTouchStart(event) {
    this.handleMouseDown(event);
  }

  handleTouchMove(event) {
    this.handleMouseMove(event);
  }

  handleTouchEnd(event) {
    this.handleMouseUp(event);
  }

  handleVariableUpdate(variables) {
    for (const [name, value] of Object.entries(variables)) {
      this.variables[name] = value;
    }

    this.updatePlot();
  }
  
  initializeWebGL() {
    const canvas = this.refs.canvas;
    this.gl = canvas.getContext('webgl');

    if (this.gl === null) {
      console.error('Unable to initialize WebGL.');
      return null;
    }
  }

  initializePlot() {
    const {expression, variables} = this.props;

    const canvas = this.refs.canvas;
    let dpr = window.devicePixelRatio;

    // Antialiasing
    if (variables.antialiasing > 0.5) {
      dpr *= 2;
    }

    // Resize canvas and WebGL viewport
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;

    this.canvasSize = [canvas.offsetWidth, canvas.offsetHeight];
    this.gl.viewport(0, 0, canvas.width, canvas.height);

    // Initialize scene and obtain WebGL variable pointers
    const variableLocations = initializeScene(
      this.gl,
      expression,
      this.variables.custom_function > 0.5,
      Object.keys(this.variables)
    );

    // Compile expression to JS function
    if (expression !== null) {this.jsExpression = toJS(expression);}

    // Check if initialized
    this.initialized = (variableLocations !== null);
    if (this.initialized) {
      this.variableLocations = variableLocations;
    }
  }

  updatePlot() {
    const variableAssignments = {};
    for (const [name, value] of Object.entries(this.variables)) {
      variableAssignments[name] = [this.variableLocations[name], value];
    }

    // Debounce
    const now = +new Date();
    if (this.lastUpdate === null || now - this.lastUpdate > 1e3 / FPS_LIMIT) {
        drawScene(this.gl, variableAssignments);
        this.lastUpdate = now;
    }
  }

  render() {
    const {position, mouseDown} = this.state;
    const {expression} = this.props;

    const [x, y] = this.pixelToPlot(...position);

    const complexVariables = Object.fromEntries(Object.entries(this.variables).map(
        ([k, v]) => [k, [v, 0]]
    ));
    const mapping = this.jsExpression === null ? null : (z => {
        try {
            return this.jsExpression(z, complexVariables);
        } catch {
            return [NaN, NaN];
        }
    });

    return (
      <div id='function-plot'>
	<div id='fallback-text'>
	  Please enable WebGL to use the plotter.
	</div>
	<canvas
	  ref='canvas'

	  onMouseDown={(event) => this.handleMouseDown(event)}
	  onMouseMove={(event) => this.handleMouseMove(event)}
	  onMouseUp={(event) => this.handleMouseUp(event)}

	  onMouseEnter={(event) => this.handleMouseMove(event)}
	  onMouseLeave={(event) => this.handleMouseUp(event)}

	  onTouchStart={(event) => this.handleTouchStart(event)}
	  onTouchMove={(event) => this.handleTouchMove(event)}
	  onTouchEnd={(event) => this.handleTouchEnd(event)}

	  onWheel={(event) => this.handleZoom(event)}

          className='main-plot'
	/>
        {isNaN(x) || isNaN(y) ? null :
            <CoordinateOverlay x={x} y={y} mapping={mapping}/>
        }

        <style jsx>{`
            canvas.main-plot {
                cursor: ${mouseDown ? 'grabbing' : 'grab'};
            }
        `}</style>
      </div>
    );
  }
}

export default FunctionPlot;
