import {
  functionDefinitions,
} from './complex-functions.js';
import {
    toGLSL
} from './translators';

function loadShader(gl, type, source) {
  // Create and compile shader
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Test for successful compilation
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log('Shader failed to compile: '
      + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


function createShaderProgram(gl, expression, customShader, variableNames) {
  const fragmentShaderSource = getFragmentShaderSource(
    expression,
    customShader, 
    gl.drawingBufferWidth, gl.drawingBufferHeight,
    variableNames
  );

  if (fragmentShaderSource === null) {return null;}

  // Load vertex and fragment shaders
  const vertexShader = loadShader(gl,
    gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = loadShader(gl,
    gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (vertexShader === null | fragmentShader === null) {
    return null;
  }

  // Create shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Test for successful linkage
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log('Shader program failed to initialize: '
      + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

export default createShaderProgram;


const vertexShaderSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
  }
`;


function getFragmentShaderSource(expression, customShader, width, height, variableNames) {
  const x_offset = (width/2).toFixed(2);
  const y_offset = (height/2).toFixed(2);
  const dpr = window.devicePixelRatio.toFixed(4);

  const variableDeclarations = variableNames.map(
    (name) => `uniform vec2 ${name};`
  ).join('\n');

  let custom_code = '';
  let glsl_expression = null;
  if (customShader) {
    custom_code = expression;
    glsl_expression = 'mapping(z)';
  } else {
    glsl_expression = toGLSL(expression);
  }
  if (glsl_expression === null) {return null;}

  console.log('Shader Code:', glsl_expression);

  return `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  const float PI = 3.14159265358979323846;
  const float TAU = 2.0*PI;
  const float LN2 = 0.69314718055994531;

  const float checkerboard_scale = 0.25;

  const vec2 ONE = vec2(1, 0);
  const vec2 I = vec2(0, 1);
  const vec2 C_PI = vec2(PI, 0);
  const vec2 C_TAU = vec2(TAU, 0);
  const vec2 C_E = vec2(2.718281845904523, 0);
  const vec2 C_PHI = vec2(1.61803398, 0);

  ${variableDeclarations}

  ${functionDefinitions}

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  vec3 get_color(vec2 z) {
    float magnitude = length(z);
    float phase = atan(z.y, z.x);

    float color_value;
    float color_saturation = 1.0;
    if (continuous_gradient.x > 0.5) {
      float color_lightness = 0.5 + atan(0.5 * log(magnitude))/PI;
      color_saturation = 1.0;

      if (invert_gradient.x > 0.5) {
	color_lightness = 1.0 - color_lightness;
      }

      /* HSL to HSV conversion */
      color_lightness *= 2.0;
      color_saturation *= 1.0 - abs(color_lightness - 1.0);
      color_value = (color_lightness + color_saturation) / 2.0;
      color_saturation /= color_value;
    } else {
      color_value = 0.5 * exp2(fract(log2(magnitude)));

      if (invert_gradient.x > 0.5) {
	color_value = 1.5 - color_value;
      }
    }

    if (enable_checkerboard.x > 0.5) {
      vec2 checkerboard_components = floor(2.0 * fract(z/checkerboard_scale));
      float checkerboard = floor(2.0 * fract((checkerboard_components.x + checkerboard_components.y)/2.0));
      color_value *= 0.8 + 0.2 * checkerboard;
    }

    vec3 hsv_color = vec3(phase/TAU, color_saturation, color_value);
    return hsv2rgb(hsv_color);
  }

  ${custom_code}

  void main() {
    const vec2 screen_offset = vec2(${x_offset}, ${y_offset});
    vec2 plot_center = vec2(center_x.x, center_y.x);

    float scale = exp(log_scale.x) * ${dpr};
    if (antialiasing.x > 0.5) {scale *= 2.0;}

    vec2 z = (gl_FragCoord.xy - screen_offset) / scale + plot_center;
    vec2 w = ${glsl_expression};

    vec3 color = get_color(w);
    gl_FragColor = vec4(color, 1.0);
  }
  `;
}
