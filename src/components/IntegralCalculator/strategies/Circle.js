import Strategy from './Strategy';

import {isNil} from 'lodash';

import {integrateReal} from './util';


class Circle extends Strategy {
    center = null;
    radius = null;

    pageCenter = null;
    pageRadius = null;

    integrate(x, y) {
        if (isNil(this.center)) {this.center = [x, y];}
        this.radius = Math.hypot(x - this.center[0], y - this.center[1]);
    }

    draw(x, y) {
        if (isNil(this.pageCenter)) {this.pageCenter = [x, y];}
        this.pageRadius = Math.hypot(x - this.pageCenter[0], y - this.pageCenter[1]);

        this.canvas.clearRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height);
        this.canvas.beginPath();
        this.canvas.arc(...this.pageCenter, this.pageRadius, 0, 2 * Math.PI);
        this.canvas.stroke();
    }

    value() {
        // Return 0 if not initialized
        if (isNil(this.center)) {return [0, 0];}
        const [x, y] = this.center;

        // Parameterize circle and compute pullback of integrand
        const gamma = theta => [
            x + this.radius * Math.cos(theta),
            y + this.radius * Math.sin(theta),
        ];
        const gammaPrime = theta => [
            -this.radius * Math.sin(theta),
            this.radius * Math.cos(theta),
        ];
        const integrand = theta => {
            const [u, v] = this.mapping(gamma(theta));
            const [up, vp] = gammaPrime(theta);
            return [u * up - v * vp, u * vp + v * up];
        }

        // Divide circle into arcs and integrate along each
        const N = 32;
        const scaleFactor = 2 * Math.PI / N;
        const result = [0, 0];
        for (let i=0; i < N; i++) {
            const [u, v] = integrateReal(
                i * scaleFactor, (i + 1) * scaleFactor, integrand
            );

            result[0] += u;
            result[1] += v;
        }

        return result;
    }
}

export default Circle;
