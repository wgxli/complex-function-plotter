import {
  functionDefinitions,
} from './complex-functions.js';
import toGLSL from './translators/to-glsl';

function loadShader(gl, type, source) {
  // Create and compile shader
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Test for successful compilation
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader failed to compile: '
      + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


function createShaderProgram(gl, expression, customShader, variableNames) {
  if (expression === null) {return null;}

  gl.LOG_MODE = !customShader; // Whether to use (log-magnitude, phase) representation
  const fragmentShaderSource = getFragmentShaderSource(
    expression,
    customShader, 
    gl.drawingBufferWidth, gl.drawingBufferHeight,
    variableNames,
    gl.LOG_MODE
  );

  if (fragmentShaderSource === null) {return null;}

//  console.log(fragmentShaderSource);

  // Load vertex and fragment shaders
  const vertexShader = loadShader(gl,
    gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = loadShader(gl,
    gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (vertexShader === null | fragmentShader === null) {
    return null;
  }

  // TODO Debug
//  const ext = gl.getExtension('WEBGL_debug_shaders');
//  console.log(ext.getTranslatedShaderSource(fragmentShader));

  // Create shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Test for successful linkage
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Shader program failed to initialize: '
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


function getFragmentShaderSource(expression, customShader, width, height, variableNames, LOG_MODE) {
  const x_offset = (width/2).toFixed(2);
  const y_offset = (height/2).toFixed(2);
  const dpr = window.devicePixelRatio.toFixed(4);

  const vectype = LOG_MODE ? 'vec3' : 'vec2';

  const variableDeclarations = variableNames.map(
    (name) => `uniform ${vectype} ${name};`
  ).join('\n');

  let custom_code = '';
  let glsl_expression = null;
  if (customShader) {
    custom_code = expression;
    glsl_expression = 'mapping(z)';
  } else {
    glsl_expression = toGLSL(expression, LOG_MODE)[0];
    if (LOG_MODE) {
        glsl_expression = `upconvert(${glsl_expression})`
    }
  }
  if (glsl_expression === null) {return null;}

  console.log('Compiled AST:', expression);
  console.log(`Shader Code (${LOG_MODE ? 'log-cart' : 'cartesian'}):`, glsl_expression);

  return `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  const float PI = 3.14159265358979323846264;
  const float TAU = 2.*PI;
  const float E = 2.718281845904523;
  const float LN2 = 0.69314718055994531;
  const float LN2_INV = 1.442695040889634;
  const float LNPI = 1.1447298858494001741434;
  const float PHI = 1.61803398874989484820459;
  const float SQ2 = 1.41421356237309504880169;

  const float checkerboard_scale = 0.25;

  const ${vectype} ZERO = ${LOG_MODE ? 'vec3(0)' : 'vec2(0)'};
  const ${vectype} ONE = ${LOG_MODE ? 'vec3(1., 0, 0)' : 'vec2(1., 0)'};
  const ${vectype} I = ${LOG_MODE ? 'vec3(0, 1., 0)' : 'vec2(0, 1.)'};
  const ${vectype} C_PI = ${LOG_MODE ? 'vec3(PI, 0, 0)' : 'vec2(PI, 0)'};
  const vec2 C_TAU = vec2(TAU, 0);
  const vec2 C_E = vec2(E, 0);
  const vec2 C_PHI = vec2(PHI, 0);

  ${variableDeclarations}

  vec2 clogcart(${vectype} z) {return vec2(${LOG_MODE ? 'log(length(z.xy)) + z.z' : 'log(length(z))'}, atan(z.y, z.x));}
  vec2 encodereal(float a) {return vec2(log(abs(a)), 0.5*PI*(1. - sign(a)));}
  ${LOG_MODE ? 'vec3 downconvert(vec3 z) {return vec3(vec2(z.xy) * exp(z.z), 0);}' : 'vec2 downconvert (vec2 z) {return z;}'}
  vec3 upconvert(vec3 z) {float l = length(z.xy); return vec3(z.xy/l, z.z + log(l));}

  ${functionDefinitions(expression, LOG_MODE)}

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  vec3 get_color(${vectype} z_int, float derivative, float phase_derivative) {
    vec2 magphase = clogcart(z_int);
    magphase.x *= LN2_INV;
    magphase.y = mod(magphase.y, TAU);
    vec2 z = ${LOG_MODE ? 'downconvert(z_int).xy' : 'z_int'};

    float color_value;
    float color_saturation = 1.0;

    ${LOG_MODE ? `float phase_decay_factor = 1./clamp(8. * phase_derivative, 1., 10000.0);
    color_saturation *= phase_decay_factor;` : ''}

    if (continuous_gradient.x > 0.5) {
      float color_lightness = 0.5 + atan(0.35 * magphase.x)/PI;
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
      color_value = 0.5 * exp2(fract(magphase.x));

      if (invert_gradient.x > 0.5) {
	color_value = 1.5 - color_value;
      }

${LOG_MODE ? 'color_value += (0.75 - color_value) * (1. - phase_decay_factor);' : ''}
    }

    if (enable_checkerboard.x > 0.5) {
      vec2 checkerboard_components = floor(2.0 * fract(z/checkerboard_scale));
      float checkerboard = floor(2.0 * fract((checkerboard_components.x + checkerboard_components.y)/2.0));

      // Anti-Moire
      float decay_factor = clamp(40. * derivative, 1., 10000.0) - 1.;
      checkerboard = 0.5 + (checkerboard - 0.5) / (1. + 3. * decay_factor);

      if (magphase.x > 15.) {checkerboard = 0.5;}

      color_value *= 0.8 + 0.2 * checkerboard;
    }

    vec3 hsv_color = vec3(magphase.y/TAU, color_saturation, color_value);
    return hsv2rgb(hsv_color);
  }

  ${custom_code}

  const vec2 screen_offset = vec2(${x_offset}, ${y_offset});
  vec2 from_pixel(vec2 xy) {
    vec2 plot_center = vec2(center_x.x, center_y.x);
    float scale = exp(-log_scale.x) / ${dpr};
    return scale * (xy - screen_offset) + plot_center;
  }

  ${vectype} internal_mapping(vec2 xy) {
      vec2 z_int = from_pixel(xy);
      ${LOG_MODE ? 'vec3 z = vec3(z_int, 0);' : 'vec2 z = z_int;'}
      return ${glsl_expression};
  }

  void main() {
    // Set up for supersampling
    const vec2 A = vec2(0.125, 0.375);
    const vec2 B = vec2(0.375, -0.125);
    vec2 xy = gl_FragCoord.xy;

    // 4-Rook supersampling
    ${vectype} w1 = internal_mapping(xy + A);
    ${vectype} w2 = internal_mapping(xy - A);
    ${vectype} w3 = internal_mapping(xy + B);
    ${vectype} w4 = internal_mapping(xy - B);

    // Anti-Moire
    float phase_derivative = ${LOG_MODE ? '0.5*(length(w1-w2) + length(w3-w4))' : '0.'};
    float derivative = ${LOG_MODE ? 'phase_derivative * exp(min(w1.z, 20.))' : '0.5 * (length(w1 - w2) + length(w3 - w4))'};

    vec3 color1 = get_color(w1, derivative, phase_derivative);
    vec3 color2 = get_color(w2, derivative, phase_derivative);
    vec3 color3 = get_color(w3, derivative, phase_derivative);
    vec3 color4 = get_color(w4, derivative, phase_derivative);

    vec3 color =  0.25 * (color1 + color2 + color3 + color4);
    gl_FragColor = vec4(color, 1.0);
  }
  `;
}
