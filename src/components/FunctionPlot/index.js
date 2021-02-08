import React, {PureComponent} from 'react';

import {initializeScene, drawScene} from '../../gl-code/scene.js';
import {toJS} from '../../gl-code/translators';

import CoordinateOverlay from './CoordinateOverlay';

import './function-plot.css';


const FPS_LIMIT = 70;

let canvasSize = [];

function pixelToPlot(x, y, variables) {
    const scale = Math.exp(variables.log_scale);
    const offset_x = variables.center_x;
    const offset_y = variables.center_y;

    const plot_x = (x - canvasSize[0]/2) / scale + offset_x;
    const plot_y = (canvasSize[1]/2 - y) / scale + offset_y;
    return [plot_x, plot_y];
}

function plotToPixel(plot_x, plot_y, variables) {
    const scale = Math.exp(variables.log_scale);
    const offset_x = variables.center_x;
    const offset_y = variables.center_y;

    const x = scale * (plot_x - offset_x) + canvasSize[0]/2;
    const y = -scale * (plot_y - offset_y) - canvasSize[1]/2;
    return [x, y];
}

class FunctionPlot extends PureComponent {
  state = {
      position: [NaN, NaN, 0],
      mouseDown: false,
  }

  constructor(props) {
    super(props);

    this.gl = null;

    this.variableLocations = {};
    this.initialized = false;

    this.lastUpdate = null; // Timestamp of last update, for debouncing
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
    const {variables} = this.props;

    if (!position.every(isFinite)) {return;}
    const [x, y, _] = position;

    // Recenter plot at scroll location
    const [mouse_plotx, mouse_ploty] = pixelToPlot(x, y, variables);
    variables.center_x = mouse_plotx;
    variables.center_y = mouse_ploty;
    
    // Change scale
    if (deltaLogScale === undefined) {
      deltaLogScale = (wheelEvent.deltaY > 0) ? -0.05: 0.05;
    }
    variables.log_scale += deltaLogScale;

    // Move center back onto mouse
    const [new_mouse_plotx, new_mouse_ploty] = pixelToPlot(x, y, variables);
    const [x_shift, y_shift] = [new_mouse_plotx - mouse_plotx, new_mouse_ploty - mouse_ploty];
    variables.center_x -= x_shift;
    variables.center_y -= y_shift;

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
    const {variables} = this.props;

    // Handle dragging of plot
    if (mouseDown) {
      const {position} = this.state;
      const [x, y, logDistance] = this.getPosition(event);

      const deltaPosition = [
	x - position[0],
	y - position[1],
	logDistance - position[2]
      ];

      const scale = Math.exp(variables.log_scale);
      variables.center_x -= deltaPosition[0] / scale;
      variables.center_y += deltaPosition[1] / scale;
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
      variables[name] = value;
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

    // Resize canvas and WebGL viewport
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;

    canvasSize = [canvas.offsetWidth, canvas.offsetHeight];
    this.gl.viewport(0, 0, canvas.width, canvas.height);

    // Initialize scene and obtain WebGL variable pointers
    const variableLocations = initializeScene(
      this.gl,
      expression,
      variables.custom_function > 0.5,
      Object.keys(variables)
    );

    // Check if initialized
    this.initialized = (variableLocations !== null);
    if (this.initialized) {
      this.variableLocations = variableLocations;
    }
  }

  updatePlot() {
    const {variables} = this.props;
    const variableAssignments = {};
    for (const [name, value] of Object.entries(variables)) {
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
    const {expression, variables} = this.props;

    const [x, y] = pixelToPlot(position[0], position[1], variables);
    const mapping = toJS(expression, variables);

    return (
      <div id='function-plot'>
	<div id='fallback-text'>
            Loading...
            <div className='small'>If nothing happens, please check that Javascript and WebGL are enabled.</div>
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
        {isFinite(x) && isFinite(y) ?
            <CoordinateOverlay x={x} y={y} mapping={mapping}/>
        : null}

        <style jsx>{`
            canvas.main-plot {
                cursor: ${mouseDown ? 'grabbing' : 'grab'};
            }
        `}</style>
      </div>
    );
  }
}

export {pixelToPlot, plotToPixel};
export default FunctionPlot;
