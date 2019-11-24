import Strategy from './Strategy';

class TestIntegrator extends Strategy {
    count = 0;

    update(data) {
        this.count++;
    }

    value() {
        return [this.count, 1];
    }
}

export default TestIntegrator;
