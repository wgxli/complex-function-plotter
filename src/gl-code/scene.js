import createShaderProgram from './shaders.js';


function initBuffers(gl) {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // Positions of vertices (two triangles)
  const vertices = [
    -1, -1,
    1, -1,
    -1, 1,

    -1, 1,
    1, -1,
    1, 1
  ]

  // Initialize buffer with position data
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertices),
    gl.STATIC_DRAW
  );
}

function initializeScene(gl, expression, customShader, variableNames) {
  const shaderProgram = createShaderProgram(
    gl,
    expression, customShader,
    variableNames
  );

  if (shaderProgram === null) {
    console.log(
      `Expression ${expression} could not be compiled!`
    );
    return null;
  }

  // Initialize shader program
  initBuffers(gl);
  gl.useProgram(shaderProgram);

  // Initialize vertex array
  const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Retrieve pointers to variables
  const variableLocations = {};
  for (const name of variableNames) {
    variableLocations[name] = gl.getUniformLocation(shaderProgram, name);
  }
  return variableLocations;
}

function drawScene(gl, variables) {
//  gl.clearColor(0.0, 0.0, 0.0, 1.0);
//  gl.clear(gl.COLOR_BUFFER_BIT);

  // Set variable values
  for (const [location, value] of Object.values(variables)) {
    gl.uniform2f(location, value, 0);
  }

  // Draw scene
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export {initializeScene, drawScene};
