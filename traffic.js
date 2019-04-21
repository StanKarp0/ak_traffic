const DIRECTION_NS = 1;
const DIRECTION_EW = 2;

// =============== CAR ===============

class Car {
    constructor(velocity) {
        this.velocity = velocity;
        this.place = null;
    }

    step() {
        const self = this;
        // console.log(this.place, this.place.count_to_next_car(), this.place.count_to_crossing());
        this.place.set_next_car(self, this.velocity);
    }

}

// =============== BASIC ROAD PARTS ===============

class RoadPart {

    constructor() {
        this.next_part = null;
        this.car = null;
        this.next_car = null;
    }

    init(next_part) {
        this.next_part = next_part;
    }

    set_next_car(car, step) {
        if (step == 0) {
            this.next_car = car;
        } else {
            this.next_part.set_next_car(car, step - 1);
        }
    }

    aprove_step() {
        this.car = this.next_car;
        if (this.car) {
            const self = this;
            this.car.place = self;
            this.next_car = null;
        }
    }

    has_car() {
        return this.car != null;
    }

    count_to_next_car() {
        return this.next_part.has_car() ? 0: this.next_part.count_to_next_car() + 1; 
    }

    count_to_crossing() {
        return this.next_part.count_to_crossing() + 1; 
    }
}

class CrossingEntry extends RoadPart {

    constructor(crossing, direction) {
        super();
        this.crossing = crossing;
        this.direction = direction;
    }

    count_to_crossing() {
        return -1; 
    }
}

// =============== GENERAL PARTS ===============

class Road {
    constructor(road_parts_count, direction) {
        this.parts_count = road_parts_count;
        this.direction = direction;

        // 0 - leave
        // n - enter
        this.parts = [new RoadPart()];
        this.parts[0].i = 0;

        for (let i = 1; i < this.parts_count; i++) {
            const part = new RoadPart();
            part.init(this.parts[i - 1]);
            part.i = i;
            this.parts.push(part);
        }
    }

    init(next_part) {
        this.parts[0].init(next_part);
    }

    get_car_road_part(part_index) {
        return this.parts[part_index].car;
    }

    set_car(part_index, car) {
        this.parts[part_index].car = car;
        car.place = this.parts[part_index];
    }

    aprove_step() {
        for (let i = 0; i < this.parts.length; i++) {
            this.parts[i].aprove_step();
        }
    }
    
    enter_part() {
        return this.parts[this.parts.length-1];
    }

}


class Crossing {

    constructor(flow_direction) {
        const self = this;
        this.flow_direction = flow_direction;
        this.crossing_entry_ns = new CrossingEntry(self, DIRECTION_NS);
        this.crossing_entry_ew = new CrossingEntry(self, DIRECTION_EW);
    }

    init(next_road_ns, next_road_ew) {
        this.next_road_ns = next_road_ns;
        this.next_road_ew = next_road_ew;
        this.crossing_entry_ns.init(next_road_ns.enter_part());
        this.crossing_entry_ew.init(next_road_ew.enter_part());
    }

    get_car() {
        const car_ns = this.crossing_entry_ns.car;
        const car_ew = this.crossing_entry_ew.car;
        return car_ns != null ? car_ns : (car_ew != null ? car_ew : null);
    }

    aprove_step() {
        this.crossing_entry_ns.aprove_step();
        this.crossing_entry_ew.aprove_step();
    }
}

// =============== FACADE ===============

class Facade {

    constructor(crossings_count_ns, crossings_count_ew, road_parts_count, density) {

        this.car_density = density / 100.0;
        this.crossings_count_ew = crossings_count_ew;
        this.crossings_count_ns = crossings_count_ns;
        this.road_parts_count = road_parts_count;
        
        this._construct_crossings();
        this._construct_connections();
        this._addCars();
    }

    get_car_road_part(road_index, road_part_index) {
        const car = this._roads[road_index].get_car_road_part(road_part_index);
        return car != null ? this._cars.indexOf(car) : null;
    }

    get_car_crossing(crossing_row, crossing_column) {
        const crossing = this._crossings[crossing_row][crossing_column];
        const car = crossing.get_car();
        return car != null ? this._cars.indexOf(car) : null;
    }

    get_road_index(crossing_row, crossing_column, direction) {
        const crossing = this._crossings[crossing_row][crossing_column];
        const road = direction == DIRECTION_NS ? crossing.next_road_ns : crossing.next_road_ew;
        return this._roads.indexOf(road);
    }

    get_road_direction(road_index) {
        return this._roads[road_index].direction;
    }

    cars_lenght() {
        return this._cars.length;
    }

    perform_step() {
        for (let car_id = 0; car_id < this._cars.length; car_id++) {
            this._cars[car_id].step();
        }

        for (let road_index = 0; road_index < this._roads.length; road_index++) {
            this._roads[road_index].aprove_step();
        }

        for (let row = 0; row < this._crossings.length; row++) {
            for (let column = 0; column < this._crossings[row].length; column++) {
                this._crossings[row][column].aprove_step();
            }
        }

    }

    _construct_crossings() {
        // Function construct crossings as 2d grid 

        this._crossings = new Array(this.crossings_count_ns);
        this._roads = [];
        for (let row = 0; row < this._crossings.length; row++) {
            this._crossings[row] = new Array(this.crossings_count_ew);
            for (let column = 0; column < this._crossings[row].length; column++) {
                // crosing
                this._crossings[row][column] = new Crossing(DIRECTION_NS);
                this._crossings[row][column].row = row;
                this._crossings[row][column].column = column;
                
                // road ns
                const road_ns = new Road(this.road_parts_count, DIRECTION_NS);
                this._roads.push(road_ns);
                
                // road ew
                const road_ew = new Road(this.road_parts_count, DIRECTION_EW);                
                this._roads.push(road_ew);

                this._crossings[row][column].init(road_ns, road_ew);
            }
        }
    }

    _construct_connections() {
        for (let row = 0; row < this._crossings.length; row++) {
            for (let column = 0; column < this._crossings[row].length; column++) {

                const next_row = (row + 1) % this._crossings.length;
                const next_column = (column + 1) % this._crossings[row].length;

                const crossing = this._crossings[row][column];
                const next_crossing_ns = this._crossings[next_row][column];
                const next_crossing_ew = this._crossings[row][next_column];

                crossing.next_road_ns.init(next_crossing_ns.crossing_entry_ns);
                crossing.next_road_ew.init(next_crossing_ew.crossing_entry_ew);
            }
        }

    }

    _addCars() {
        this._cars = [];
        for (let road_index = 0; road_index < this._roads.length; road_index++) {
            for (let part_index = 0; part_index < this.road_parts_count; part_index++) {
                if (Math.random() <= this.car_density) {
                    const velocity = 1;
                    const car = new Car(velocity);
                    this._roads[road_index].set_car(part_index, car);
                    this._cars.push(car);
                }
            }
        }
    }

}