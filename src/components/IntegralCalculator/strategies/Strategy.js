class Strategy {
    constructor(mapping, canvas, dpr) {
        this.mapping = mapping;
        this.canvas = canvas;
        this.dpr = dpr;

        this.initialize();
    }

    initialize() {
        this.canvas.strokeStyle = 'white';
        this.canvas.lineWidth = 2 * this.dpr;
    }
    
    update(data) {
        const {x, y, clientX, clientY} = data;
        this.integrate(x, y);
        this.draw(clientX, clientY);
    }

    finish() {}

    integrate(x, y) {}

    draw(x, y) {}

    value() {
        return [0, 0];
    }
}

export default Strategy;
