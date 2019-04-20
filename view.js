class View {

    constructor(facade, grid_name) {
        // constans
        this.img_size = 600;
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

        d3.select(grid_name).html("");
        this._data = this._calculate_data();
        this._data_array = [];
        for (let key in this._data) {
            const box = this._data[key];
            box.car = key;
            this._data_array.push(box);
        }
        
        var grid = d3.select(grid_name)
            .append("svg")
            .attr("width", this.img_size +"px")
            .attr("height", this.img_size +"px")
            .style("display", "block")
            .style("margin", "auto");


        var column = grid.selectAll(".square")
            .data(this._data_array)
            .enter().append("rect")
            .attr("class","square")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; })
            .attr("width", function(d) { return d.width; })
            .attr("height", function(d) { return d.height; })
            .style("fill", function(d) { return d.fill; })
            .style("stroke", "#000000")
            .on('click', function(d) {});
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

    _point_from_crossing(row, column) {
        const x_box = (this.margin_count + (1 + this.p_count) * column) % this.columns_count;
        const y_box = (this.margin_count + (1 + this.p_count) * row) % this.rows_count;
        return {
            x: x_box * this.box_width,
            y: y_box * this.box_height,
            x_box: x_box,
            y_box: y_box,
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
        point.x_box = (point.x_box + (direction == DIRECTION_NS ? 0 : part)) % this.columns_count;
        point.y_box = (point.y_box + (direction == DIRECTION_EW ? 0 : part)) % this.rows_count;
        point.x = point.x_box * this.box_width;
        point.y = point.y_box * this.box_height;
        return point;
    }


}