import React from 'react';

import withStyles from '@material-ui/core/styles/withStyles';

import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';

import MenuIcon from '@material-ui/icons/Menu';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import {functions, constants} from '../../gl-code/parse-expression.js';

import './help-text.css';


const styles = theme => ({
  buttonStyle: {
    ...theme.typography.button
  },
  chip: {
    margin: 3
  }
});

const supportedFunctions = [
  {
    name: 'Operators',
    entries: ['+', '-', '*', '/', '^', '!']
  },
  {
    name: 'Trigonometry',
    entries: [
      'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
      'arcsin', 'arccos', 'arctan', 'arcsec', 'arccsc', 'arccot',
      'sinh', 'cosh', 'tanh', 'sech', 'csch', 'coth',
      'arsinh', 'arcosh', 'artanh', 'arsech', 'arcsch', 'arcoth'
    ]
  },
  {
    name: 'Exponential',
    entries: ['exp', 'log', 'ln']
  },
  {
    name: 'Constants',
    entries: Array.from(constants)
  },
  {
    name: 'Miscellaneous',
    entries: [
      'sqrt',
      'gamma', 'eta', 'zeta',
      'abs', 'arg', 'conj', 'cis',
      'real', 'imag',
    ]
  }
];

class HelpText extends React.PureComponent {
  constructor(props) {
    super(props);
    this.classes = props.classes;
  }

  renderChips(entries) {
    return entries.map(label =>
      <Chip 
	key={label}
	label={label}
	className={this.classes.chip}
      />
    );
  }
  
  renderSupportedFunctions() {
    const sections = []
    for (const section of supportedFunctions) {
      sections.push(
	<div key={section.name}>
	  <h3>{section.name}</h3>
	  {this.renderChips(section.entries)}
	</div>
      );
    }
    return sections;
  }

  render() {
    return (
      <div id='help-text'>
	<h1>
                <img src='/android-chrome-192x192.png' className='logo'/>
                <div className='text'>
                    Complex Function Plotter
                    <div className='subtitle'>
                        Made with {'<3'} by Samuel J. Li
                    </div>
                </div>
        </h1>

	<h2>Introduction</h2>
	<p>Creates interactive, domain-colored plots of complex functions.</p>
	<p>Each point on the complex plane is colored according to the value of the function at that point.
	Hue and brightness are used to display phase and magnitude, respectively.</p>
	<p>To increase the displayable range of values, brightness cycles from dark to light repeatedly with magnitude, jumping at every power of two.
	The “edges” of regions with different brightness correspond to curves along which the function has constant magnitude.
	</p>
	<p>This method allows for quick visualization of the locations and orders of any poles and zeros.
	For more information, see the <a href='https://en.wikipedia.org/wiki/Domain_coloring'>Wikipedia article on domain coloring.</a></p>

	<h2>Controls</h2>
	<p>To plot a complex function, enter its expression in the top bar. Parentheses (curved or square), complex number literals, and arbitrary variables (see “Variables” below) are supported. Input is case-insensitive.</p>
	<p>A red underline will appear if the expression cannot be plotted. You might have made a syntax error or forgot to declare a variable.</p>
	<p>Drag the plot to pan, and use the scroll wheel to zoom in and out.</p>

	<h2>Supported Functions</h2>
	<div className='help-indent'>
	  {this.renderSupportedFunctions()}
	</div>

	<h2>Variables</h2>
	<p>Expressions can contain arbitrary user-defined variables.</p>
	<p>
	Click on the <MenuIcon style={{fontSize: 20}}/> icon in the upper-left corner to open the variables panel.
	Variables can be added with the <span className={this.classes.buttonStyle}>Add</span> button and removed with the <DeleteIcon style={{fontSize: 20}}/> button.</p>

	<p>
	Click on the variable’s current value or the slider’s upper & lower bounds to edit them.
	</p>
	
	<p>Any string of lowercase letters can be used as a variable name, except for reserved functions, the built-in variable <i>z</i>, and the constant <i>i</i>.</p>

	<h2>Options</h2>
	<p>The following options can be found below the variables panel:</p>
	
	<div className='help-indent'>
	  <h3>Enable Checkerboard</h3>
	  <p>Overlays a checkerboard with eight squares per unit length, colored according to the real and imaginary parts of the function’s value.</p>

	  <h3>Invert Gradient</h3>
	  <p>Reverses the direction of the magnitude gradient. When the gradient is inverted, the apparent height of the “layers” formed correlate with the magnitude of the function.</p>

	  <h3>Continuous Gradient</h3>
	  <p>Use a continuous magnitude gradient rather than the “stepped” default. Reduces the range of visually discernible magnitudes, but removes shading artifacts in certain situations.</p>

	  <h3>Enable Antialiasing</h3>
	  <p>Enables antialiasing for higher-quality output. May degrade performance. Enabling this option is not recommended on mobile devices.</p>
	</div>

	<h2>Tips</h2>
	<p>To share a graph, just copy and paste the URL! The address automatically changes to reflect the plotted expression.</p>

	<h2>Advanced Features</h2>
	<ExpansionPanel>
	  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
	    <Typography variant='caption'>
	      Please read thoroughly iff you are using advanced options.
	    </Typography>
	  </ExpansionPanelSummary>
	  <ExpansionPanelDetails>
	    <div>
	      <h3>Custom Functions</h3>
	      <p>This option can be found under the “Advanced Options” heading in the left pane. Overrides the main expression bar, allowing you to code your own function.</p>
	      <p>Custom functions use the <a href='https://en.wikipedia.org/wiki/OpenGL_Shading_Language'>GLSL</a> programming language. If you've never worked with GLSL before, it's extremely similar to C. Here are a few tips and caveats:</p>
	      <ul>
		<li>Complex numbers are represented by the <tt>vec2</tt> type, which represents a 2D vector. The real part can be accessed through <tt>z.x</tt> and the imaginary part by <tt>z.y</tt>.</li>
		<li>Your custom function should be named <tt>mapping</tt>, and should take one input of type <tt>vec2</tt> and return an output of type <tt>vec2</tt>.</li>
		<li>Complex number literals <i>a+bi</i> should be entered as <tt>vec2(a, b)</tt>, even if they are real. GLSL doesn’t support addition or subtraction between the “complex” <tt>vec2</tt> type and floats. Scalar multiplication should work fine with floats, however. For convenience, there are constants <tt>ONE</tt> and <tt>I</tt> available.</li>
		<li>Addition and subtraction operators (<tt>+</tt> and <tt>-</tt>) work fine between <tt>vec2</tt> complex numbers. However, multiplication, division, and exponentiation operators act component-wise on the real and imaginary parts, which is probably not what you want. There are <tt>cmul</tt>, <tt>cdiv</tt>, and <tt>cpow</tt> functions available which will perform the proper complex operation.</li>
		<li>All supported functions are available, but with a <tt>c</tt> prefix. For example, the sin function is named <tt>csin</tt>. This is to avoid clashing with the built-in (real-valued) GLSL functions.</li>
		<li>Constants are available in uppercase with a <tt>C_</tt> prefix (e.g. <tt>C_PI</tt>), and are already in complex <tt>vec2</tt> form.</li>
	      </ul>
	      
	      <h3>Limitations</h3>
	      <p>There are currently a few limitations with the custom function feature which I hope to resolve soon:</p>
	      <ul>
		<li>URL-based sharing doesn’t currently work for custom functions. You may share the code directly instead.</li>
		<li>The editor will show a red underline if your code fails to compile, but currently does not show useful error information. For now, this information is visible in the developer console.</li>
	      </ul>

	      <h3>Tips</h3>
	      <p>Most desktop browsers will display a small resize handle at the bottom-right corner of the left pane. This can be very useful when working on complex code.</p>
	      <p>You can define arbitrary helper functions before your <tt>mapping</tt> function — you have the full power of GLSL!</p>

	      <p><b>You can use all your declared variables</b> directly in your code! They’ve already been converted into complex <tt>vec2</tt> form.</p>
	      
	      <h3>Obligatory Warning</h3>
	      <p>This is an advanced feature — you may break things! If anything freezes or crashes, a quick reload should resolve the issue (save your code first)!</p>
	    </div>
	  </ExpansionPanelDetails>
	</ExpansionPanel>

	<h2>Acknowledgements</h2>
	<p>Inspired by David Bau’s <a href='http://davidbau.com/conformal'>Conformal Map Plotter</a>.</p>

	<Typography variant='caption'>Complex Function Plotter — Made with love by Samuel J. Li</Typography>
	<Typography variant='caption'>Found a bug? — bug.report@samuelj.li</Typography>
      </div>
    );
  }
}

export default withStyles(styles)(HelpText);
