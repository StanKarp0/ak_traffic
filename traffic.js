const DIRECTION_NS = 1;
const DIRECTION_EW = 2;
const SIDE_NORTH = 1;
const SIDE_SOUTH = 2;
const SIDE_EAST = 3;
const SIDE_WEST = 4;

class Car {
    constructor(velocity) {
        this.velocity = velocity;
        this.place = null;
    }
}

class RoadPart {
    constructor(next_part) {
        this.next_part = next_part;
        this.car = null;
    }

    count_empty() {
        return this.next_part.is_empty() ? this.next_part.count_empty() + 1: 0;
    }

    is_empty() {
        return this.cat == null;
    }
}

class Road {
    constructor(next_crossing_entry, road_parts_count) {
        this.next_crossing_entry = next_crossing_entry;
        this.road_parts_count = road_parts_count;

        this.parts = [new RoadPart(next_crossing_entry)];
        this.parts[0].i = 0;
        for (let i = 1; i < road_parts_count; i++) {
            const part = new RoadPart(this.parts[i - 1]);
            part.i = i;
            this.parts.push(part);
        }
    }

    count_empty() {
        return this.parts[0].count_empty();
    }

    set_car(part_index, car) {
        this.parts[part_index].car = car;
        car.place = this.parts[part_index];
    }
}


class CrossingEntry {

    constructor(crossing, direction) {
        this.crossing = crossing;
        this.direction = direction;
    }

    is_empty() {
        if (this.direction == DIRECTION_EW) 
            return this.crossing.is_empty_ew();
        else if (this.direction == DIRECTION_NS) 
            return this.crossing.is_empty_ns();
        return false;
    }

}

class Crossing {

    constructor(flow_direction) {
        this.next_road_ns = null;
        this.next_road_ew = null;

        this.taken = false;
        this.flow_direction = flow_direction;

        const self = this;
        this.crossing_entry_ns = new CrossingEntry(self, DIRECTION_NS);
        this.crossing_entry_ew = new CrossingEntry(self, DIRECTION_EW);
    }

    is_empty_ns() {
        return this.flow_direction == DIRECTION_NS && !this.taken;
    }

    is_empty_ew() {
        return this.flow_direction == DIRECTION_EW && !this.taken;
    }

}

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

    is_empty_road_part(road_index, road_part_index) {
        return true;
    }

    is_empty_crossing(crossing_index) {
        return true;
    }

    // get_road_index(crossing_index, )

    _constructCrossings() {
        // Function construct crossings as 2d grid 

        this.crossings = new Array(this.crossings_count_ns);
        for (let row = 0; row < this.crossings.length; row++) {
            this.crossings[row] = new Array(this.crossings_count_ew);
            for (let column = 0; column < this.crossings[row].length; column++) {
                this.crossings[row][column] = new Crossing(DIRECTION_NS);
            }
        }
    }

    _constructRoads() {
        // Roads
        this.roads = [];
        
        // NORTH-SOUTH roads
        const rows =  this.crossings.length
        for (let row = 0; row < this.crossings.length; row++) {
            for (let column = 0; column < this.crossings[row].length; column++) {
                const road = new Road(this.crossings[(row + 1) % rows][column].crossing_entry_ns, this.road_parts_count);
                this.crossings[row][column].next_road_ns = road;
                this.roads.push(road);
            }
        }

        // EAST-WEST roads
        for (let row = 0; row < this.crossings.length; row++) {
            const columns = this.crossings[row].length
            for (let column = 0; column < columns; column++) {
                const road = new Road(this.crossings[row][(column + 1) % columns].crossing_entry_ew, this.road_parts_count);
                this.crossings[row][column].next_road_ew = road;
                this.roads.push(road);
            }
        }

    }

    _addCars() {
        // Dictionary to check if car was placed in road before
        const positions = {};
        for (let road_index = 0; road_index < this.roads.length; road_index++) 
            positions[road_index] = [];

        this.cars = [];
        while (this.cars.length < this.cars_count) {
            const road_index = Math.floor(Math.random() * this.roads.length); 
            const part_index = Math.floor(Math.random() * this.roads[road_index].road_parts_count);
            if (!positions[road_index].includes(part_index)) {
                const velocity = 1.;
                const car = new Car(velocity);
                this.roads[road_index].set_car(part_index, car);
                positions[road_index].push(part_index);
                this.cars.push(car);
            }
        }
    }

}