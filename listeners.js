function onLoad() {
    const startElement = document.getElementById('start_btn');
    
    // configuration
    const road_lenght = parseInt(document.getElementById("road_lenght").value, 10);
    const ns_roads = parseInt(document.getElementById("ns_roads").value, 10);
    const ew_roads = parseInt(document.getElementById("ew_roads").value, 10);
    const density = parseInt(document.getElementById("density").value, 10);
    const prob = parseInt(document.getElementById("prob").value, 10) / 100;
    const lights = parseInt(document.getElementById("lights").value, 10);
    const max_speed = parseInt(document.getElementById("max_speed").value, 10);

    // old animation turning off
    if(startElement.controller) {
        startElement.controller.stop();
    }
    
    // configure new components
    const facade = new Facade(ns_roads, ew_roads, road_lenght, density, prob, max_speed);
    const view = new View(facade, "#grid");
    const controller = new Controller(facade, view, 200, lights);
    
    startElement.controller = controller;
    startElement.innerHTML = "Start"
}

function onClickStart() {
    const startElement = document.getElementById('start_btn');
    const controller = startElement.controller;
    
    if (controller) {
        if (controller.isPlaying) {
            controller.stop();
            startElement.innerHTML = "Start"
        } else {
            controller.start();
            startElement.innerHTML = "Stop"
        }
    }
}

function onClickStep() {
    const startElement = document.getElementById('start_btn');
    const controller = startElement.controller;

    if (controller) {
        if (controller.isPlaying) {
            controller.stop();
            startElement.innerHTML = "Start"
        }
        controller.nextStep();
    }
}

window.onload = onLoad
