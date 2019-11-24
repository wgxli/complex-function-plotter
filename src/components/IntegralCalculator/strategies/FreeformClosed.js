import Freeform from './Freeform';

import {isNil} from 'lodash';

class FreeformClosed extends Freeform {
    startPoint = null;
    startPagePoint = null;

    integrate(x, y) {
        super.integrate(x, y);
        if (isNil(this.startPoint)) {
            this.startPoint = [x, y];
        }
    }

    draw(x, y) {
        super.draw(x, y);
        if (isNil(this.startPagePoint)) {
            this.startPagePoint = [x, y];
        }
    }

    finish() {
        if (isNil(this.startPoint) || isNil(this.startPagePoint)) {return;}

        // Loop back to start
        const [x, y] = this.startPoint;
        const [clientX, clientY] = this.startPagePoint;
        this.update({
            x, y,
            clientX, clientY
        });
    }
}

export default FreeformClosed;
