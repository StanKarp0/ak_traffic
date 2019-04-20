class View {

    constructor(facade, grid) {
        // constans
        this.img_size = 1000;
        this.click = 0;

        // components
        this.facade = facade;
        this.grid = grid;

        // helpers
        this.ns_count = facade.crossings_count_ns;
        this.ew_count = facade.crossings_count_ew;
        this.p_count = facade.road_parts_count;
        this.columns_count = (facade.road_parts_count + 1) * this.ew_count;
        this.rows_count = (facade.road_parts_count + 1) * this.ns_count;
        this.box_width = this.img_size / this.columns_count;
        this.box_height = this.img_size / this.rows_count;

        // left and right margins - when counts are odd
        this.margin_count = Math.floor(this.p_count / 2);

        this._refresh_data();
        d3.select(grid).html("");
    }
    
    _refresh_data() {
        this.data = [];
        for (let row = 0; row < this.ew_count; row++) {
            for (let column = 0; column < this.ns_count; column++) {

                if (this.facade.has_car_crossing(row, column)) 
                    this.data.push(this._point_from_crossing(row, column));

                const road_ns = this.facade.get_road_index(row, column, DIRECTION_NS);
                const road_ew = this.facade.get_road_index(row, column, DIRECTION_EW);

                for(let part = 0; part < this.p_count; part++) {

                    if (this.facade.has_car_road_part(road_ns, part)) 
                        this.data.push(this._point_from_road(row, column, road_ns, part));
                    if (this.facade.has_car_road_part(road_ew, part)) 
                        this.data.push(this._point_from_road(row, column, road_ew, part));
                    
                }
            }
        }
    }

    _point_from_crossing(row, column) {
        const x_box = this.margin_count + (1 + this.p_count) * column;
        const y_box = this.margin_count + (1 + this.p_count) * row;
        return {
            x: x_box * this.box_width,
            y: y_box * this.box_height,
            width: this.box_width,
            height: this.box_height, 
            click: this.click,
            v: 1,
            fill: "#aabbcc",
        };
    }

    _point_from_road(row, column, road, part) {
        const point = this._point_from_crossing(row, column);
        const direction = this.facade.get_road_direction(road);
        point.x += direction == DIRECTION_NS ? 0 : part * this.box_width;
        point.y += direction == DIRECTION_EW ? 0 : part * this.box_height;
        return point;
    }


}