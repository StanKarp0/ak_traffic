class View {

    constructor(facade, grid_name) {
        // constans
        this.img_size = 500;
        this.click = 0;

        // components
        this.facade = facade;
        this.grid_name = grid_name;

        // helpers
        this.ns_count = facade.crossings_count_ns;
        this.ew_count = facade.crossings_count_ew;
        this.p_count = facade.road_parts_count;
        this.columns_count = (facade.road_parts_count + 1) * this.ew_count;
        this.rows_count = (facade.road_parts_count + 1) * this.ns_count;
        this.box_width = this.img_size / (this.columns_count);
        this.box_height = this.img_size / (this.rows_count);

        // left and right margins - when counts are odd
        this.margin_count = Math.floor(this.p_count / 2);

        // background data
        this._backgroud = this._calculate_background_data();

        d3.select(this.grid_name).html("");
        this._grid = d3.select(this.grid_name)
            .append("svg")
            .attr("width", this.img_size +"px")
            .attr("height", this.img_size +"px")
            .style("display", "block")
            .style("margin", "auto");

        const self = this;

        // background data
        this._back = this._grid.selectAll(".square_empty")
            .data(this._backgroud)
            .enter().append("rect")
            .attr("class","square_empty")
            .attr("x", function(d) { return d.x * self.box_width; })
            .attr("y", function(d) { return d.y * self.box_height; })
            .attr("width", this.box_width)
            .attr("height", this.box_height);

        // car data
        this._data_array = [];
        for (let car = 0; car < facade.cars_lenght(); car++) {
            this._data_array.push({car: car});
        }
        this._cars = this._grid.selectAll(".square_car")
            .data(this._data_array)
            .enter().append("rect")
            .attr("class","square_car")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.box_width)
            .attr("height", this.box_height)
            .attr("id", function(d) {return "car" + d.car;});
    }

    draw_cars() {
        const data = this._calculate_data();
        for (let key in data) {
            const box = data[key];
            const key_id = "#car" + key;

            const car = this._grid.select(key_id)
                .attr("x", box.x * this.box_width)
                .attr("y", box.y * this.box_height)

        }
    }
    
    _calculate_data() {
        var data = {};
        for (let row = 0; row < this.ns_count; row++) {
            for (let column = 0; column < this.ew_count; column++) {

                const crossing_car = this.facade.get_car_crossing(row, column)
                if (crossing_car != null) 
                    data[crossing_car] = this._point_from_crossing(row, column);

                const road_ns = this.facade.get_road_index(row, column, DIRECTION_NS);
                const road_ew = this.facade.get_road_index(row, column, DIRECTION_EW);

                for(let part = 0; part < this.p_count; part++) {
                    
                    const ns_car = this.facade.get_car_road_part(road_ns, part);
                    if (ns_car != null) 
                        data[ns_car] = this._point_from_road(row, column, road_ns, part);

                    const ew_car = this.facade.get_car_road_part(road_ew, part);
                    if (ew_car != null) 
                        data[ew_car] = this._point_from_road(row, column, road_ew, part);                    
                }
            }
        }
        return data;
    }

    _calculate_background_data() {
        const data = [];
        const fill = "#ffffff"
        for (let row = 0; row < this.ns_count; row++) {
            for (let column = 0; column < this.ew_count; column++) {

                data.push(this._point_from_crossing(row, column, fill));

                const road_ns = this.facade.get_road_index(row, column, DIRECTION_NS);
                const road_ew = this.facade.get_road_index(row, column, DIRECTION_EW);

                for(let part = 0; part < this.p_count; part++) {
                    data.push(this._point_from_road(row, column, road_ns, part, fill));
                    data.push(this._point_from_road(row, column, road_ew, part, fill));                    
                }
            }
        }
        return data;
    }

    _point_from_crossing(row, column) {
        const x_box = (this.margin_count + (1 + this.p_count) * column) % this.columns_count;
        const y_box = (this.margin_count + (1 + this.p_count) * row) % this.rows_count;
        return {
            x: x_box,
            y: y_box,
        };
    }

    _point_from_road(row, column, road, part) {
        const point = this._point_from_crossing(row, column);
        const direction = this.facade.get_road_direction(road);

        const shift_ns = direction == DIRECTION_NS ? 0 : (this.p_count - part);
        const shift_ew = direction == DIRECTION_EW ? 0 : (this.p_count - part);

        point.x = (point.x + shift_ns) % this.columns_count;
        point.y = (point.y + shift_ew) % this.rows_count;

        return point;
    }


}