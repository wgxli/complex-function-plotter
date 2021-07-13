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
  if (expression === null) {return null;}

  const shaderProgram = createShaderProgram(
    gl,
    expression, customShader,
    variableNames
  );

  if (shaderProgram === null) {
    console.error('AST could not be compiled:', expression);
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

function drawScene(gl, variables, axis_ctx) {
  // Set variable values
  for (const [location, value] of Object.values(variables)) {
    gl.uniform2f(location, value, 0);
  }

  // Draw scene
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Draw coordinate axes
  drawAxes(axis_ctx, variables);
}

function drawAxes(ctx, variables) {
    // Clear canvas
    const dpr = window.devicePixelRatio;
    const [width, height] = [window.innerWidth * dpr, window.innerHeight * dpr];
    ctx.clearRect(0, 0, width, height);
    if (variables.enable_axes[1] < 0.5) {return;}

    // Compute display scales
    const scale = Math.exp(variables.log_scale[1]) * dpr;
    
    let rawLogLabelScale = 2.3 - variables.log_scale[1] / Math.log(10);
    rawLogLabelScale += 3e-2 * Math.abs(rawLogLabelScale); // Make room for long labels
    let logLabelScale = Math.round(rawLogLabelScale);
    let labelScale = Math.pow(10, logLabelScale);

    if (logLabelScale - rawLogLabelScale > 0.2) {
        labelScale /= 5;
        logLabelScale--;
    } else if (logLabelScale - rawLogLabelScale > 0) {
        labelScale /= 2;
        logLabelScale--;
    }

    // Compute origin location in screen space
    const [x0, y0] = [
        width/2 - scale*variables.center_x[1],
        height/2 + scale*variables.center_y[1],
    ];

    // Compute window bounds
    const [x_min, x_max] = [-x0/scale, (width - x0)/scale];
    const [y_min, y_max] = [(y0-height)/scale, y0/scale];


    // Utility functions
    function horizontalLine(y) {
        const yy = Math.round(y0 - scale*y);
        ctx.moveTo(0, yy);
        ctx.lineTo(width, yy);
    }

    function verticalLine(x, lineWidth) {
        const xx = Math.round(x0 + scale*x);
        ctx.moveTo(xx, 0);
        ctx.lineTo(xx, height);
    }

    function xLabel(x) {
        const xx = x0 + scale * x;
        if (xx > width - 30*dpr || xx < 30*dpr) {return;}

        const dy = (y0 < height/3) ? 22 : -10;
        const y = Math.min(Math.max(y0 + dy*dpr, 90 * dpr), height-20*dpr);

        let label = x.toFixed(Math.max(0, -logLabelScale)).replace('-', '−');
        const textWidth = ctx.measureText(label).width + 6 * dpr;

        ctx.textAlign = 'center'
        ctx.clearRect(xx - textWidth/2, y - 18*dpr, textWidth, 24*dpr);
        ctx.strokeText(label, xx, y);
        ctx.fillText(label, xx, y);
    }

    function yLabel(y, iWidth) {
        const yy = y0 - scale * y + 6 * dpr;
        if (yy > height - 50*dpr || yy < 100*dpr) {return;}

        const alignLeft = (x0 < 2*width/3);
        const dx = alignLeft ? 10: -10;
        ctx.textAlign = alignLeft ? 'left' : 'right';

        const x = Math.min(Math.max(x0 + dx*dpr, 20 * dpr), width -20*dpr);

        let label = y.toFixed(Math.max(0, -logLabelScale)).replace('-', '−');
        if (label === '1') {label = '';}
        if (label === '−1') {label = '−';}

        ctx.font = `${20 * dpr}px Computer Modern Serif`;
        const textWidth = ctx.measureText(label).width;

        const clearWidth = textWidth + iWidth + 8*dpr;
        ctx.clearRect(
            x - (alignLeft ? 3*dpr : clearWidth - 4*dpr),
            yy - 18*dpr,
            clearWidth,
            24*dpr
        );

        const textOffset = alignLeft ? 0 : -iWidth - dpr;
        ctx.strokeText(label, x + textOffset, yy);
        ctx.fillText(label, x + textOffset, yy);

        ctx.font = `italic ${20 * dpr}px Computer Modern Serif`;
        const iOffset = alignLeft ? textWidth + dpr : 0;
        ctx.strokeText('i', x + iOffset, yy);
        ctx.fillText('i', x + iOffset, yy);
    }


    // Draw gridlines
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle= '#ffffff';

    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = Math.ceil(x_min/labelScale); i < x_max/labelScale; i++) {
        if (i === 0) {continue;}
        verticalLine(i * labelScale);
    }
    for (let i = Math.ceil(y_min/labelScale); i < y_max/labelScale; i++) {
        if (i === 0) {continue;}
        horizontalLine(i * labelScale);
    }
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    verticalLine(0);
    horizontalLine(0);
    ctx.stroke();

    // Draw labels
    ctx.font = `${20 * dpr}px Computer Modern Serif`;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#444444';
    for (let i = Math.ceil(x_min/labelScale); i < x_max/labelScale; i++) {
        if (i === 0) {continue;}
        xLabel(i * labelScale);
    }


    ctx.font = `italic ${20 * dpr}px Computer Modern Serif`;
    const iWidth = ctx.measureText('i').width;
    for (let i = Math.ceil(y_min/labelScale); i < y_max/labelScale; i++) {
        if (i === 0) {continue;}
        yLabel(i * labelScale, iWidth);
    }
}

export {initializeScene, drawScene};
