import Strategy from './Strategy';

import {isNil} from 'lodash';

import {integrateSegment} from './util';


class FreeformIntegrator extends Strategy {
    accumulator = [0, 0];

    lastPoint = null;
    lastPagePoint = null;

    integrate(x, y) {
        if (!isNil(this.lastPoint)) {
            // Integrate along segment between last and current points
            const df = integrateSegment(this.lastPoint, [x, y], this.mapping);
            this.accumulator[0] += df[0]
            this.accumulator[1] += df[1];
        }
        this.lastPoint = [x, y];
    }

    draw(x, y) {
        if (!isNil(this.lastPagePoint)) {
            const [lastX, lastY] = this.lastPagePoint;
            this.canvas.beginPath();
            this.canvas.moveTo(lastX, lastY);
            this.canvas.lineTo(x, y);
            this.canvas.stroke();
        }
        this.lastPagePoint = [x, y];
    }

    value() {
        return this.accumulator;
    }
}

export default FreeformIntegrator;
