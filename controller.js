class Controller {

    constructor(facade, view, delay) {
        this.facade = facade;
        this.view = view;
        this.delay = delay;

        this.isPlaying = false;
        this.draw();
    }

    nextStep() {
        this.facade.perform_step();
        this.draw();
    }

    draw() {
        this.view.draw_cars();
    }

    animate() {
        clearInterval(this.interval);
        this.interval = setInterval(() => {
            if (this.isPlaying) {
                this.nextStep();
            } else {
                clearInterval(this.interval);
            }
        }, this.delay);
    }

    start() {
        this.isPlaying = true;
        this.animate();
    }

    stop() {
        this.isPlaying = false;
    }

}