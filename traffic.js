const DIRECTION_NS = 1;
const DIRECTION_EW = 2;


class Car {

    constructor(velocity) {
        this.velocity = velocity;
        this.place = null;
        this.next_place = null;
    }

}

class RoadPart {

    constructor(next_part) {
        this.next_part = next_part;
        this.car = null;
    }

    count_empty() {
        return this.car != null ? 0 : this.next_part.count_empty() + 1;
    }

}

class Path {

    constructor(next_crossing_entry, d) {
        this.next_crossing_entry = next_crossing_entry;
        this.d = d;

        this.roads = [new Road(next_crossing_entry)];
        for (let i = 1; i < d; i++) {
            this.roads.push(new Road(this.roads[0]));
        }
    }

    is_empty() {
        return this.roads[0].taken;
    }

    taken(index) {
        return this.roads[index].taken;
    }

}


class CrossingEntry {

    constructor(crossing, direction) {
        this.crossing = crossing;
        this.direction = direction;
    }

    is_empty() {
        if (this.direction == DIRECTION_EW) {
            return this.crossing.is_empty_ew();
        } else if (this.direction == DIRECTION_NS) {
            return this.crossing.is_empty_ns();
        }
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

    constructor(n, d) {

        this.n = n;
        this.d = d;

        this.constructCrossings();

    }

    constructCrossings() {
        this.crossings = new Array(this.n);
        for (let row = 0; row < this.crossings.length; row++) {
            this.crossings[row] = new Array(this.n);
            for (let column = 0; column < this.crossings[row].length; column++) {
                this.crossings[row][column] = new Crossing(DIRECTION_NS);
            }
        }

        this.paths = [];
        
        for (let row = 0; row < this.crossings.length; row++) {
            for (let column = 0; column < this.crossings[row].length - 1; column++) {
                const path = new Path(this.crossings[row][column + 1].crossing_entry_ew);
                this.crossings[row][column].next_road_ew = path;
                this.paths.push(path);
            }
            this.crossings[row][this.n - 1].next_road_ew = this.crossing[row][0].crossing_entry_ew;
        }

        for (let row = 0; row < this.crossings.length - 1; row++) {
            for (let column = 0; column < this.crossings[row].length; column++) {
                const path = new Path(this.crossings[row + 1][column].crossing_entry_ns);
                this.crossings[row][column].next_road_ns = path;
                this.paths.push(path);
            }
            this.crossings[row][this.n - 1].next_road_ew = this.crossing[row][0].crossing_entry_ew;
        }

    }

}