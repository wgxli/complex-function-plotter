import React from 'react';

import {InlineMath, BlockMath} from 'react-katex';

import {formatComplex} from '../util';

const PREFIX = '\\int_{\\gamma} f(z) \\, \\mathrm{d}z = ';

export default ({x, y, style}) => {
let contents = <div className='error'>
    Custom functions are currently unsupported.
    <style jsx>{`
        .error {
            color: hsl(0, 100%, 30%);
            font-size: 18px;
            padding: 8px 0;
        }
    `}</style>
</div>;

if (isFinite(x) && isFinite(y)) {
    if (window.innerWidth < 700) {
        contents = <div className='math'>
        <InlineMath>{PREFIX}</InlineMath>
        <InlineMath>{formatComplex(x, y)}</InlineMath>
        <style jsx>{`
            .math {
                font-size: 16px;
                color: hsl(213, 10%, 15%);

                display: flex;
                flex-direction: column;
                align-items: center;

                margin: 5px 0;
            }
        `}</style>
        </div>;
    } else {
        contents = <div className='math'>
        <BlockMath>{PREFIX + formatComplex(x, y)}</BlockMath>
        <style jsx>{`
            .math {
                margin: -10px 0;
                font-size: 20px;
                color: hsl(213, 10%, 15%);
            }
        `}</style></div>;
    }
}

return <div className='container' style={style || {}}>
    <div className='math'>{contents}</div>
    <style jsx>{`
        .container {
            background-color: white;
            box-shadow: 3px 3px 8px hsla(213, 10%, 10%, 0.2);
            border: 1px solid hsl(213, 10%, 85%);
            border-radius: 8px;

            padding: 0 15px;
        }

        @media (max-width: 700px) {
        }
    `}</style>
</div>};
