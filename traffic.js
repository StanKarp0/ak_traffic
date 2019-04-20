const DIRECTION_NS = 1;
const DIRECTION_EW = 2;

// =============== CAR ===============

class Car {
    constructor(velocity) {
        this.velocity = velocity;
        this.place = null;
    }
}

// =============== BASIC ROAD PARTS ===============

class RoadPart {

    constructor(next_part) {
        this.next_part = next_part;
        this.car = null;
    }

    has_car() {
        return this.car != null;
    }

    count_empty() {
        return this.next_part.has_car() ? 0: this.next_part.count_empty() + 1;
    }
}

class CrossingEntry {

    constructor(crossing, direction) {
        this.crossing = crossing;
        this.direction = direction;
    }

    has_car() {
        return this.crossing.has_car();
    }

    count_empty() {
        if (this.direction != this.crossing.flow_direction) {
            return 0;
        } else {
            const next = this.direction == DIRECTION_NS ? this.crossing.next_road_ns: this.crossing.next_road_ew;
            return next.has_car() ? 0: next.count_empty() + 1;
        }
    }
}

// =============== GENERAL PARTS ===============

class Road {
    constructor(next_crossing_entry, road_parts_count, direction) {
        this.next_crossing_entry = next_crossing_entry;
        this.road_parts_count = road_parts_count;
        this.direction = direction;

        this.parts = [new RoadPart(next_crossing_entry)];
        this.parts[0].i = 0;
        for (let i = 1; i < road_parts_count; i++) {
            const part = new RoadPart(this.parts[i - 1]);
            part.i = i;
            this.parts.push(part);
        }
    }

    has_car_road_part(part_index) {
        return this.parts[part_index].has_car()
    }

    set_car(part_index, car) {
        this.parts[part_index].car = car;
        car.place = this.parts[part_index];
    }
}


class Crossing {

    constructor(flow_direction) {
        this.next_road_ns = null;
        this.next_road_ew = null;

        this.car = null;
        this.flow_direction = flow_direction;

        const self = this;
        this.crossing_entry_ns = new CrossingEntry(self, DIRECTION_NS);
        this.crossing_entry_ew = new CrossingEntry(self, DIRECTION_EW);
    }

    has_car() {
        return this.car != null; 
    }

    set_car(car) {
        this.car = car;
    }
}

// =============== FACADE ===============

class Facade {

    constructor(crossings_count_ns, crossings_count_ew, road_parts_count, cars_count) {

        this.crossings_count_ew = crossings_count_ew;
        this.crossings_count_ns = crossings_count_ns;
        this.road_parts_count = road_parts_count;
        this.cars_count = cars_count;

        this._constructCrossings();
        this._constructRoads();
        this._addCars();
    }

    has_car_road_part(road_index, road_part_index) {
        return this._roads[road_index].has_car_road_part(road_part_index);
    }

    has_car_crossing(crossing_row, crossing_column) {
        return this._crossings[crossing_row][crossing_column].has_car();
    }

    get_road_index(crossing_row, crossing_column, direction) {
        const crossing = this._crossings[crossing_row][crossing_column];
        const road = direction == DIRECTION_NS ? crossing.next_road_ns : crossing.next_road_ew;  
        return this._roads.indexOf(road);
    }

    get_road_direction(road_index) {
        return this._roads[road_index].direction;
    }

    _constructCrossings() {
        // Function construct crossings as 2d grid 

        this._crossings = new Array(this.crossings_count_ns);
        for (let row = 0; row < this._crossings.length; row++) {
            this._crossings[row] = new Array(this.crossings_count_ew);
            for (let column = 0; column < this._crossings[row].length; column++) {
                this._crossings[row][column] = new Crossing(DIRECTION_NS);
            }
        }
    }

    _constructRoads() {
        // Roads
        this._roads = [];
        
        // NORTH-SOUTH roads
        const rows =  this._crossings.length
        for (let row = 0; row < this._crossings.length; row++) {
            for (let column = 0; column < this._crossings[row].length; column++) {
                const road = new Road(this._crossings[(row + 1) % rows][column].crossing_entry_ns, this.road_parts_count, DIRECTION_NS);
                this._crossings[row][column].next_road_ns = road;
                this._roads.push(road);
            }
        }

        // EAST-WEST roads
        for (let row = 0; row < this._crossings.length; row++) {
            const columns = this._crossings[row].length
            for (let column = 0; column < columns; column++) {
                const road = new Road(this._crossings[row][(column + 1) % columns].crossing_entry_ew, this.road_parts_count, DIRECTION_EW);
                this._crossings[row][column].next_road_ew = road;
                this._roads.push(road);
            }
        }

    }

    _addCars() {
        // Dictionary to check if car was placed in road before
        const positions = {};
        for (let road_index = 0; road_index < this._roads.length; road_index++) 
            positions[road_index] = [];

        this._cars = [];
        while (this._cars.length < this.cars_count) {
            const road_index = Math.floor(Math.random() * this._roads.length); 
            const part_index = Math.floor(Math.random() * this._roads[road_index].road_parts_count);
            if (!positions[road_index].includes(part_index)) {
                const velocity = 1.;
                const car = new Car(velocity);
                this._roads[road_index].set_car(part_index, car);
                positions[road_index].push(part_index);
                this._cars.push(car);
            }
        }
    }

}