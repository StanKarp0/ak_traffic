class View {

    constructor(facade, grid_name, delay) {
        // constans
        this.img_size = 500;
        this.click = 0;
        this.delay = delay;

        // components
        this.facade = facade;
        this.grid_name = grid_name;

        // helpers
        this.ns_count = facade.crossings_count_ns;
        this.ew_count = facade.crossings_count_ew;
        this.p_count = facade.road_parts_count;
        this.columns_count = (facade.road_parts_count + 1) * this.ew_count;
        this.rows_count = (facade.road_parts_count + 1) * this.ns_count;

        // box config
        this.box_width = this.img_size / (this.columns_count);
        this.box_height = this.img_size / (this.rows_count);

        // left and right margins - when counts are odd
        this.margin_count = Math.floor(this.p_count / 2);

        // background data
        
        d3.select(this.grid_name).html("");
        this._grid = d3.select(this.grid_name)
        .append("svg")
        .attr("width", this.img_size +"px")
        .attr("height", this.img_size +"px")
        .style("display", "block")
        .style("margin", "auto");
        
        const self = this;
        
        // background data
        this._grid.selectAll(".square_empty")
            .data(this._calculate_background_data())
            .enter().append("rect")
            .attr("class","square_empty")
            .attr("x", function(d) { return d.x * self.box_width; })
            .attr("y", function(d) { return d.y * self.box_height; })
            .attr("width", this.box_width)
            .attr("height", this.box_height);

        // car data

        this._grid.selectAll(".square_car")
            .data(this._calculate_car_init_data())
            .enter().append("rect")
            .attr("class","square_car")
            .attr("x", 0)
            .attr("y", 0)
            .attr("box_x", 0)
            .attr("box_y", 0)
            .attr("width", this.box_width)
            .attr("height", this.box_height)
            .attr("id", function(d) {return "car" + d.car;});

        // crossings lights
        this._grid.selectAll(".lights")
            .data(this._calculate_lights_init_data())
            .enter().append("rect")
            .attr("class","lights")
            .attr("x", function(d) { return d.x * self.box_width; })
            .attr("y", function(d) { return d.y * self.box_height; })
            .attr("width", function(d) { return d.w * self.box_width; })
            .attr("height", function(d) { return d.h * self.box_height; })
            .attr("fill", function(d) { return d.dir ? "#00ff00" : "#ff0000"; })
            .attr("id", function(d) {return d.id;});
    }

    draw_cars() {
        const data = this._calculate_car_data();
        for (let key in data) {
            const box = data[key];
            const car = this._grid.select("#car" + key);

            const box_x_old = car.attr('box_x');
            const box_y_old = car.attr('box_y');

            const x = box.x * this.box_width;
            const y = box.y * this.box_height;

            car                  
                .attr("box_x", box.x)
                .attr("box_y", box.y)


            if (box_x_old < box.x || box_y_old < box.y) {
                car.transition()
                    .ease(d3.easeLinear)
                    .duration(this.delay)
                    .attr("x", x)
                    .attr("y", y)
            } else if (box_x_old > box.x) {
                
                const part1 = this.columns_count - box_x_old;
                const part2 = box.x;
                const v = (this.delay + 1) / (part1 + part2);

                const delay1 = v * part1;
                const delay2 = v * part2;

                car.transition()
                .ease(d3.easeLinear)
                .duration(delay1)
                .attr("x", this.img_size)
                .attr("y", y)
                .on("end", function() {
                    car
                    .attr("opacity", 0)
                    car
                    .attr("x", 0)
                    .attr("y", y)
                    car
                    .transition()
                    .ease(d3.easeLinear)
                    .duration(delay2)
                    .attr("x", x)
                    .attr("y", y)    
                    car
                    .attr("opacity", 1)
                })
                    
            } else if (box_y_old > box.y) {
                const part1 = this.rows_count - box_y_old;
                const part2 = box.y;
                const v = (this.delay + 1) / (part1 + part2);

                const delay1 = v * part1;
                const delay2 = v * part2;

                

                car.transition()
                .ease(d3.easeLinear)
                .duration(delay1)
                .attr("x", x)
                .attr("y", this.img_size)
                .on("end", function() {
                    car
                    .attr("opacity", 0)
                    car
                    .attr("x", x)
                    .attr("y", 0)
                    car
                    .transition()
                    .ease(d3.easeLinear)
                    .duration(delay2)
                    .attr("x", x)
                    .attr("y", y)      
                    car
                    .attr("opacity", 1)  
                    
                }) 
            }
        }
        
    }

    draw_lights() {
        const data = this._calculate_lights_data();
        for (let key in data) {
            const box = data[key];
            this._grid.select("#" + key)
                .attr("fill", box.dir ? "#00ff00" : "#ff0000")

        }
    }

    _calculate_car_init_data() {
        const data_cars = [];
        for (let car = 0; car < this.facade.cars_lenght(); car++) {
            data_cars.push({car: car});
        }
        return data_cars;
    }
    
    _calculate_car_data() {
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

    _calculate_lights_init_data() {
        const data_dict = this._calculate_lights_data();
        const data_list = [];
        for (let key in data_dict) {
            data_list.push(data_dict[key]);
        }
        return data_list;
    }

    _calculate_lights_data() {
        const data = {};
        for (let row = 0; row < this.ns_count; row++) {
            for (let column = 0; column < this.ew_count; column++) {
                const direction = this.facade.get_crossing_flow(row, column);
                const point = this._point_from_crossing(row, column);
                const id = "ligths" + row + "_" + column + "_"; 

                data[id + "n"] = {x: point.x - 1.0, y: point.y - 0.5, dir: direction == DIRECTION_NS, id: id + "n", h: 0.5, w: 1};
                data[id + "w"] = {x: point.x - 0.5, y: point.y + 1.0, dir: direction == DIRECTION_EW, id: id + "w", h: 1, w: 0.5};
                data[id + "s"] = {x: point.x + 1.0, y: point.y + 1.0, dir: direction == DIRECTION_NS, id: id + "s", h: 0.5, w: 1};
                data[id + "e"] = {x: point.x + 1.0, y: point.y - 1.0, dir: direction == DIRECTION_EW, id: id + "e", h: 1, w: 0.5};
            }
        }
        return data;
    }

    _point_from_crossing(row, column) {
        return {
            x: (this.margin_count + (1 + this.p_count) * column) % this.columns_count,
            y: (this.margin_count + (1 + this.p_count) * row) % this.rows_count,
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