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

import {Light as SyntaxHighlighter} from 'react-syntax-highlighter';
import glslHighlighter from 'react-syntax-highlighter/dist/esm/languages/hljs/glsl';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import {constants} from '../../gl-code/parse-expression.js';

import './help-text.css';

SyntaxHighlighter.registerLanguage('glsl', glslHighlighter);


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
        name: 'Elliptic',
        entries: [
            'sn(z, k)',
            'cn(z, k)',
            'dn(z, k)',
            'wp(z, τ)',
            "wp'(z, τ)",
            'theta00(z, τ)',
            'theta01(z, τ)',
            'theta10(z, τ)',
            'theta11(z, τ)',
            'sm', 'cm',
        ]
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


const EXAMPLES = {
    '+': 'z + t',
    '-': 'z - t',
    '*': 't * z',
    '/': '1/z',
    '^': 'z^z^z^z^z^z^z',
    '!': 'z!',

    'e': null,
    'pi': null,
    'tau': null,
    'phi': null,

    'sn(z, k)': 'sn(z, t + i)',
    'cn(z, k)': 'cn(z, t + i)',
    'dn(z, k)': 'dn(z, t + i)',
    'wp(z, τ)': 'wp(z, t + i)',
    "wp'(z, τ)": "wp'(z, t + i)",
    'theta00(z, τ)': 'theta00(z, t + i)',
    'theta01(z, τ)': 'theta01(z, t + i)',
    'theta10(z, τ)': 'theta10(z, t + i)',
    'theta11(z, τ)': 'theta11(z, t + i)',
};


class HelpText extends React.PureComponent {
    constructor(props) {
        super(props);
        this.classes = props.classes;
    }

    renderChips(entries) {
        const {setExpression, closeMenu} = this.props;
        const showExample = (label) => setExpression(
            EXAMPLES[label] || `${label}(z)`
        );
        return entries.map(label =>
            <Chip 
                key={label}
                label={label}
                onClick={EXAMPLES[label] === null ? undefined : () => {
                    if (window.innerWidth <= 900) {closeMenu();}
                    showExample(label);
                }}
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
                    <img src='android-chrome-192x192.png' className='logo' alt='logo'/>
                    <div className='text'>
                        Complex Function Plotter
                        <div className='subtitle'>
                            Made with {'<3'} by Samuel J. Li
                        </div>
                    </div>
                </h1>

                <h2>Introduction</h2>
                <p>Creates interactive domain-coloring plots of complex functions.</p>
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
                <p>Click on any function to see an example.</p>
                <div className='help-indent'>
                    {this.renderSupportedFunctions()}
                </div>

                <h2>Variables</h2>
                <p>Expressions can contain arbitrary user-defined variables.</p>
                <p>
                    Click on the <MenuIcon style={{fontSize: 20, marginBottom: -5}}/> icon in the upper-left corner to open the variables panel.
                    Variables can be added with the <span className={this.classes.buttonStyle}>Add</span> button and removed with the <DeleteIcon style={{fontSize: 20, marginBottom: -5}}/> button.</p>

                <p>
                    Click on the variable’s current value or the slider’s upper & lower bounds to edit them.
                </p>

                <p>Any string of lowercase letters can be used as a variable name, except for reserved functions, the built-in variable <i>z</i>, and the constant <i>i</i>.</p>

                <h2>Contour Integrals</h2>
                <p>The calculator is able to compute arbitrary contour integrals and residues. The following options
                    are available under the ‘Contour Integral’ section of the left pane:</p>

                <div className='help-indent'>
                    <h3>Freeform</h3>
                    <p>After selecting this option, click and drag to draw an arbitrary contour. The integral of the currently plotted function along the given contour will be displayed.</p>

                    <h3>Freeform (Closed Loop)</h3>
                    <p>Same as ‘Freeform,’ except that the contour is closed with a line segment connecting the start and end points after it is drawn.</p>

                    <h3>Circular Contour</h3>
                    <p>After selecting this option, click and drag to draw a circular contour. The integral of the currently plotted function along the given circle (with counterclockwise orientation) will be displayed.</p>
                </div>

                <p>Note that custom functions and some of the more intricate built-in functions are not yet supported.
                    The computed values are generally accurate to the displayed precision unless the function is highly pathological.</p>


                <h2>Graphics Options</h2>
                <p>The following options can be found below the variables panel:</p>

                <div className='help-indent'>
                    <h3>Enable Checkerboard</h3>
                    <p>Overlays a checkerboard with eight squares per unit length, colored according to the real and imaginary parts of the function’s value.</p>

                    <h3>Invert Gradient</h3>
                    <p>Reverses the direction of the magnitude gradient. When the gradient is inverted, the apparent height of the “layers” formed correlate with the magnitude of the function.</p>

                    <h3>Continuous Gradient</h3>
                    <p>Use a continuous magnitude gradient rather than the “stepped” default. Reduces the range of visually discernible magnitudes, but removes shading artifacts in certain situations.</p>
                </div>

                <h2>Tips</h2>
                <p>To share a graph, just copy and paste the URL! The address automatically changes to reflect the plotted expression.</p>

                <h2>Advanced Features</h2>
                <ExpansionPanel style={{margin: '0 -5px'}}>
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
                                <li><i>(Thanks to Tim N. for pointing this out.)</i> Due to low-level limitations of GLSL, variable-length loops such as the following do not work:
                                    <SyntaxHighlighter language='glsl' style={docco}>{`for (int i=0; i<x; i++) {
    // do stuff
}`}</SyntaxHighlighter>
                                    The following workaround is available:
                                    <SyntaxHighlighter language='glsl' style={docco}>{`for (int i=0; i<1000; i++) {
    if (i<x) {
        // do stuff
    }
}`}</SyntaxHighlighter>
                                    This effectively requires setting an arbitrary but finite limit on the number of iterations you wish to do;
                                    however, this may be acceptable in several applications.
                                    Note that the loop will be unrolled during compilation, so setting an excessively high limit will lead to poor performance.
                                </li>
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

                <h2>Citations</h2>
                <p>If you use this tool to produce images for a publication, I would greatly appreciate a citation! Something along the lines of:</p>
                <ul><li>Li, Samuel Jinglian, 2018. “Complex Function Plotter.” <a href='https://samuelj.li/complex-function-plotter/'>https://samuelj.li/complex-function-plotter/</a>.</li></ul>
                <p>or the equivalent in your journal's citation style is enough.</p>

                <h2>Acknowledgements</h2>
                <ul>
                    <li>Inspired by David Bau’s <a href='http://davidbau.com/conformal'>Conformal Map Plotter</a>.</li>
                    <li>Thanks to Tim N. for helping improve the custom function documentation for variable-length loops.</li>
                    <li>Thanks to Liu Yi (Ireis, CAS) for requesting the implementation of elliptic functions.</li>
                    <li>Thanks to [Anonymous] for requesting variable animation support and other improvements.</li>
                </ul>

                <Typography variant='caption'>Complex Function Plotter — Made with love by Samuel J. Li</Typography><br/>
                <Typography variant='caption'><a href='https://github.com/wgxli/complex-function-plotter'>View the source</a> on GitHub</Typography><br/>
                <Typography variant='caption'>Found a bug? — <a href='mailto:bug.report@samuelj.li'>bug.report@samuelj.li</a></Typography>
            </div>
        );
    }
}

export default withStyles(styles)(HelpText);
