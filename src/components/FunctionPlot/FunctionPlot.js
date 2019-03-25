import React from 'react';

import {initializeScene, drawScene} from '../../gl-code/scene.js';

import './function-plot.css';


class FunctionPlot extends React.PureComponent {
  constructor(props) {
    super(props);

    this.gl = null;

    this.variables = this.props.variables;
    this.variableLocations = {};
    this.initialized = false;

    this.mouseDown = false;

    this.canvasSize = [];
    this.position = null;
  }

  componentDidMount() {
    window.addEventListener('resize', this.componentDidUpdate.bind(this));

    this.initializeWebGL();
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    this.initializePlot();
    this.updatePlot();
    this.props.onError(!this.initialized);
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
    return[x, y];
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
    this.position = this.getPosition(mouseEvent);
  }

  handleZoom(wheelEvent, deltaLogScale) {
    // Recenter plot at scroll location
    const [mouse_plotx, mouse_ploty] = this.pixelToPlot(this.position[0], this.position[1]);
    this.variables.center_x = mouse_plotx;
    this.variables.center_y = mouse_ploty;
    
    // Change scale
    if (deltaLogScale === undefined) {
      deltaLogScale = (wheelEvent.deltaY > 0) ? -0.05: 0.05;
    }
    this.variables.log_scale += deltaLogScale;

    // Move center back onto mouse
    const [new_mouse_plotx, new_mouse_ploty] = this.pixelToPlot(this.position[0], this.position[1]);
    const [x_shift, y_shift] = [new_mouse_plotx - mouse_plotx, new_mouse_ploty - mouse_ploty];
    this.variables.center_x -= x_shift;
    this.variables.center_y -= y_shift;

    this.updatePlot();
  }

  handleMouseDown(event) {
    this.updatePosition(event);
    this.mouseDown=true;
  }

  handleMouseUp(event) {
    this.mouseDown=false;
  }

  handleMouseMove(event) {
    // Handle dragging of plot
    if (this.mouseDown) {
      const [x, y, logDistance] = this.getPosition(event);

      const deltaPosition = [
	x - this.position[0],
	y - this.position[1],
	logDistance - this.position[2]
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
      console.log('Unable to initialize WebGL.');
      return null;
    }
  }

  initializePlot() {
    const canvas = this.refs.canvas;
    let dpr = window.devicePixelRatio;

    // Antialiasing
    if (this.props.variables.antialiasing > 0.5) {
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
      this.props.expression,
      this.variables.custom_function > 0.5,
      Object.keys(this.variables)
    );

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
    drawScene(this.gl, variableAssignments);
  }

  render() {
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
	/>
      </div>
    );
  }
}

export default FunctionPlot;
