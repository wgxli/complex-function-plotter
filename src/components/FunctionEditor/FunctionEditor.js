import React from 'react';

import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-glsl';
import 'prismjs/themes/prism-okaidia.css';

import './function-editor.css';

export default ({value, onChange, errorMessage}) => <div id='function-editor'>
    <Typography variant='caption'>
      Please read the “Advanced Features” documentation in the right pane before proceeding!
      <br/>
      Compilation errors are currently logged to the developer console.
    </Typography>
    <Editor
        value={value}
        onValueChange={onChange}
        highlight={code => {var a = highlight(code, languages.glsl); console.log(a); return a;}}
        padding={10}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 14,
          backgroundColor: 'hsl(200, 20%, 10%)',
          color: 'white',
          marginTop: 10,
          borderRadius: 8,
        }}
    />
</div>;
