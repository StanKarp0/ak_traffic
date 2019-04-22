class Controller {

    constructor(facade, view, delay, lights_change) {
        this.facade = facade;
        this.view = view;
        this.delay = delay;

        this.isPlaying = false;
        this.lights_change = lights_change;
        this.lights_counter = 0;
        this.draw();
    }

    nextStep() {
        this.lights_counter += 1;
        if (this.lights_counter == this.lights_change) {
            this.lights_counter = 0;
            this.facade.lights_change();
        } 

        this.facade.perform_step();
        this.draw();
    }

    draw() {
        this.view.draw_cars();
        this.view.draw_lights();
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