import {complex_functions} from './complex-functions.js';

const restrictedFunctions = [];

restrictedFunctions.push(...Object.keys(complex_functions));
restrictedFunctions.push(...Object.values(complex_functions).map(f => f.name));
restrictedFunctions.push('z', 'i', 'e', 'pi', 'tau', 'phi');

/* GLSL Keywords */
restrictedFunctions.push(
  'attribute', 'const', 'uniform', 'varying',
  'layout',
  'centroid', 'flat', 'smooth', 'noperspective',
  'break', 'continue', 'do', 'for', 'while', 'switch', 'case', 'default',
  'if', 'else',
  'in', 'out', 'inout',
  'float', 'int', 'void', 'bool', 'true', 'false',
  'invariant', 'discard', 'return',
  'lowp', 'mediump', 'highp', 'precision',
  'struct',
  'common', 'partition', 'active',
  'asm', 'class', 'union', 'enum', 'typedef', 'template',
  'this', 'packed',
  'goto', 'inline', 'noinline', 'volatile', 'public', 'static',
  'extern', 'external', 'interface',
  'long', 'short', 'double', 'half', 'fixed', 'unsigned', 'superp',
  'input', 'output',
  'filter',
  'sizeof', 'cast',
  'namespace', 'using'
);

/* GLSL Built-In Functions */
restrictedFunctions.push(
  'radians', 'degrees',
  'sin', 'cos', 'tan',
  'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'asinh', 'acosh', 'atanh',
  'pow', 'exp', 'log', 'exp2', 'log2',
  'sqrt', 'inversesqrt',
  'abs', 'sign', 'floor', 'trunc', 'round',
  'ceil', 'fract',
  'mod', 'modf', 'min', 'max',
  'clamp', 'mix', 'step', 'smoothstep',
  'isnan', 'isinf',
  'length', 'distance', 'dot',
  'cross', 'normalize', 'ftransform',
  'faceforward',
  'reflect', 'refract',
  'transpose', 'inverse',
  'equal', 'any', 'all', 'not',
  'texture'
);

const functionList = new Set(restrictedFunctions);
export default functionList;
