const DIRECTION_NS = 1;
const DIRECTION_EW = 2;

// =============== CAR ===============

class Car {
    constructor(velocity, slow_probability, max_speed) {
        this.v_n = velocity;
        this.place = null;
        this.slow_probability = slow_probability;
        this.max_speed = max_speed;
    }

    step() {
        const self = this;

        const d_n = this.place.count_to_next_car() + 1;
        const s_n = this.place.to_crossing;
        
        const is_green = this.place.is_crossing_green();
        const to_red = this.place.to_red_lights();
        
        var v_n_new = this.v_n;
        // ================== PRZYSPIESZENIE ==============
        if (v_n_new < this.max_speed) {
            v_n_new += 1;
        }

        // ================== ZWALNIANIE ==================
        if (!is_green) {

        // ------------------ CZRWONE ---------------------
            const min_d_s = Math.min(d_n, s_n);
            if (min_d_s <= v_n_new) {
                v_n_new = min_d_s - 1;
            }

        } else {
        
        // ------------------ ZIELONE ---------------------
            const min_v_d = Math.min(v_n_new, d_n - 1);
            if (d_n < s_n && d_n <= v_n_new) {
                v_n_new = d_n - 1;
            } else if (d_n >= s_n && min_v_d * to_red > s_n) {
                v_n_new = min_v_d;
            }
        }

        // ================== LOSOWANIE ===================
        if (v_n_new > 0 && Math.random() < this.slow_probability) {
            v_n_new -= 1;
        }

        // ================== RUCH ========================
        this.v_n = v_n_new;
        this.place.set_next_car(self, this.v_n);
    }

}

// =============== BASIC ROAD PARTS ===============

class RoadPart {

    constructor() {
        this.next_part = null;
        this.car = null;
        this.next_car = null;

        this._cached_to_next_car = null;
        this._cached_is_green = null;
        this._cached_to_red_light = null;
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
        this._cached_is_green = null;
        this._cached_to_red_light = null;
        this._cached_to_next_car = null;
    }

    has_car() {
        return this.car != null;
    }

    count_to_next_car() {
        if (this._cached_to_next_car == null)
            this._cached_to_next_car = this.next_part.has_car() ? 0: this.next_part.count_to_next_car() + 1; 
        return this._cached_to_next_car;
    }

    is_crossing_green() {
        if (this._cached_is_green == null) {
            this._cached_is_green = this.next_part.is_crossing_green();
        }
        return this._cached_is_green;
    }

    to_red_lights() {
        if (this._cached_to_red_light == null) {
            this._cached_to_red_light = this.next_part.to_red_lights();
        }
        return this._cached_to_red_light;
    }
}

class CrossingEntry extends RoadPart {

    constructor(crossing, direction, road_length) {
        super();
        this.crossing = crossing;
        this.direction = direction;
        this.to_crossing = road_length + 1;
    }

    is_crossing_green() {
        return this.direction == this.crossing.flow_direction;
    }

    to_red_lights() {
        if (this.direction == DIRECTION_NS) {
            return this.crossing.remain_to_red_ns;
        } else if (this.direction == DIRECTION_EW){
            return this.crossing.remain_to_red_ew;
        }
        return 0;
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
        this.parts[0].to_crossing = 1;

        for (let i = 1; i < this.parts_count; i++) {
            const part = new RoadPart();
            part.init(this.parts[i - 1]);
            part.to_crossing = i + 1;
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

    constructor(flow_direction, road_length) {
        const self = this;
        this.flow_direction = flow_direction;
        this.crossing_entry_ns = new CrossingEntry(self, DIRECTION_NS, road_length);
        this.crossing_entry_ew = new CrossingEntry(self, DIRECTION_EW, road_length);
        this.remain_to_red_ns = 0; // TODO here warning
        this.remain_to_red_ew = 0;
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

    lights_change() {
        this.flow_direction = this.flow_direction == DIRECTION_NS ? DIRECTION_EW : DIRECTION_NS;
    }

    to_lights_change(remain) {
        if (this.flow_direction == DIRECTION_NS) {
            this.remain_to_red_ns = remain;
            this.remain_to_red_ew = 0;
        } else {
            this.remain_to_red_ns = 0;
            this.remain_to_red_ew = remain;
        }
    }
}

// =============== FACADE ===============

class Facade {

    constructor(crossings_count_ns, crossings_count_ew, road_parts_count, density, slow_probability, max_speed, lights_time) {

        this.car_density = density / 100.0;
        this.crossings_count_ew = crossings_count_ew;
        this.crossings_count_ns = crossings_count_ns;
        this.road_parts_count = road_parts_count;
        this.slow_probability = slow_probability; 
        this.max_speed = max_speed;
        this.remain = lights_time;
        
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

    get_crossing_flow(crossing_row, crossing_column) {
        return this._crossings[crossing_row][crossing_column].flow_direction;
    }

    cars_lenght() {
        return this._cars.length;
    }

    lights_change() {
        for (let row = 0; row < this._crossings.length; row++) {
            for (let column = 0; column < this._crossings[row].length; column++) {
                this._crossings[row][column].lights_change()
            }
        }
    }

    to_lights_change(remain) {
        this.remain = remain;
        for (let row = 0; row < this._crossings.length; row++) {
            for (let column = 0; column < this._crossings[row].length; column++) {
                this._crossings[row][column].to_lights_change(remain)
            }
        }
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
                this._crossings[row][column] = new Crossing(DIRECTION_NS, this.road_parts_count);
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
                    const car = new Car(velocity, this.slow_probability, this.max_speed);
                    this._roads[road_index].set_car(part_index, car);
                    this._cars.push(car);
                }
            }
        }
    }

}