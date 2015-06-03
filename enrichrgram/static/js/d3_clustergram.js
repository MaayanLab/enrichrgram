
// make the svg exp map (one value per tile)
function make_d3_clustergram(network_data) {

  // remove old map
  d3.select("#main_svg").remove();
  d3.select('#kinase_substrates').remove();

  // initialize clustergram variables 
  initialize_clustergram(network_data)

  // display col and row title 
  d3.select('#row_title').style('display','block');
  d3.select('#col_title').style('display','block');
  d3.select('#toggle_menu_button').style('display','inline-block');

  // remove initial paragraphs
  d3.selectAll('.initial_paragraph').style('display','none');

  // display toggle switch
  d3.select('#toggle_menu_button').style('display','inline-block');


  // define the variable zoom, a d3 method 
  zoom = d3.behavior.zoom().scaleExtent([0.5,3]).on('zoom',zoomed);

  // initialize variables 
  matrix = [] ;
  
  // initialize matrix 
  row_nodes.forEach( function(tmp,i) {
    matrix[i] = d3.range(col_nodes.length).map(function(j) { return {pos_x: j, pos_y: i, value:0, group:0}; });
  }); 

  // Add information to the matrix
  network_data.links.forEach( function(link) {
    // transfer link information to the new adj matrix
    matrix[link.source][link.target].value += link.value;
    // transfer group information to the adj matrix 
    matrix[link.source][link.target].group = 1;
  });

  

  // initailize svg_obj 
  svg_obj = d3.select("#svg_div")
      .append("svg")
      .attr('id', 'main_svg')
      // .attr("width",  svg_width  + margin.left + margin.right)
      .attr("width", '1000px')
      .attr("height", svg_height + margin.top  + margin.bottom)
      .attr('border',1)
      .call( zoom ) 
      .append("g")
      .attr('id', 'clust_group')
      .attr("transform", "translate(" + (margin.left) + "," + (margin.top) + ")");

  // disable double-click zoom: double click should reset zoom level 
  d3.select("svg").on("dblclick.zoom", null);    

  // row white rect 
  d3.select('#main_svg')
    .append('rect')
    .attr('fill', 'white')
    .attr('width', row_label_width+'px')
    .attr('height', '3000px')
    .attr('class','white_bars');

  // col white rect 
  d3.select('#main_svg')
    .append('rect')
    .attr('fill', 'white')
    .attr('height', col_label_width+'px')
    .attr('width', '3000px')
    .attr('class','white_bars');

  // column group
  d3.select('#main_svg')
    .append("g")
    .attr('id', 'col_labels')
    .attr("transform", "translate(" + col_margin.left + "," + col_margin.top + ")");

  // row group 
  d3.select('#main_svg')
    .append("g")
    .attr('id', 'row_labels')
    .attr("transform", "translate(" + row_margin.left + "," + row_margin.top + ")")

  // White Rects to cover the excess labels 
  d3.select('#main_svg')
    .append('rect')
    .attr('fill', 'white')
    .attr('width',  row_label_width+'px')
    .attr('height', col_label_width+'px')
    .attr('id','top_left_white');

  // Add the background - one large rect 
  d3.select('#clust_group')
    .append("rect")
    .attr("class", "background")
    .attr("width", clustergram_width)
    .attr("height", clustergram_height);

  // Make Expression Rows   
  // use matrix for the data join, which contains a two dimensional 
  // array of objects, each row of this matrix will be passed into the row function 
  var row_obj =  svg_obj.selectAll(".row")
    .data(matrix)
    .enter()
    .append("g")
    .attr("class", "row")
    .attr("transform", function(d, i) { return "translate(0," + y_scale(i) + ")"; })
    .each( row_function );

  // // define border width 
  // border_width = x_scale.rangeBand()/16.66
  // offset click group column label 
  x_offset_click = x_scale.rangeBand()/2 + border_width
  // reduce width of rotated rects
  reduce_rect_width = x_scale.rangeBand()* 0.36 

  // horizontal line
  row_obj.append('line')
    .attr('x2', 20*clustergram_width)
    .attr('stroke-width', border_width+'px')

  // select all columns 
  col_label_obj = d3.select('#col_labels')
    .selectAll(".col_label_text")
    .data(col_nodes)
    .enter()
    .append("g")
    .attr("class", "col_label_text")
    .attr("transform", function(d, i) { return "translate(" + x_scale(i) + ") rotate(-90)"; })

  col_label_click = col_label_obj
    // append new group for rect and label (not white lines)
    .append('g')
    .attr('class','col_label_click')
    // rotate column labels 
    .attr('transform', 'translate('+x_scale.rangeBand()/2+','+ x_offset_click +') rotate(45)')
    .on('click', reorder_click_col );

  // add separating vertical line, below the labels 
  // col_label_obj
  d3.select('#col_labels')
    .selectAll('.col_label_text')
    .append('line')
    .attr('x1', 0)
    .attr('x2', -20*clustergram_height)
    .attr('stroke-width', border_width+'px')


  // get the max abs nl_pval (find obj and get nl_pval)
  enr_max = _.max( col_nodes, function(d) { return Math.abs(d.nl_pval) } ).nl_pval ; 

  // the enrichment bar should be 3/4ths of the height of the column labels 
  bar_scale_col = d3.scale.linear()
    .domain([0, enr_max])
    .range([0, col_label_width * 0.90 ]); 

  // append enrichment bars  
  col_label_click
    .append('rect')
    // column is rotated - effectively width and height are switched
    .attr('width', function(d,i) { 
      return bar_scale_col( d.nl_pval ); 
    })
    // rotate labels - reduce width if rotating
    .attr('height', x_scale.rangeBand() - reduce_rect_width)
    .attr('fill', 'red')
    .attr('opacity', 0.5)
    .attr('transform', function(d, i) { return "translate(0,0)"; });

  // for hover effect 
  col_label_click
    .append('title')
    .text(function(d,i){ return d.pval_bh});

  // col_label_obj
  col_label_click
    .append("text")
    .attr("x", 0)
    .attr("y", x_scale.rangeBand() / 2)
    .attr('dx',2*border_width)
    // .attr("dy", ".32em")
    .attr("text-anchor", "start")
    .attr('full_name',function(d) { return d.name } )
    .style('font-size',default_fs+'px')
    .text(function(d, i) { return d.name; });


  // add triangle under rotated labels
  col_label_click
    .append('path')
    // .style('stroke','black')
    .style('stroke-width',0)
    .attr('d', function(d) { 
        // x and y are flipped since its rotated 
        origin_y = - border_width
        start_x  = 0;
        final_x  =  x_scale.rangeBand() - reduce_rect_width ;
        start_y  = -(x_scale.rangeBand() - reduce_rect_width + border_width) ;
        final_y  =  -border_width;
        output_string = 'M '+origin_y+',0 L ' + start_y + ',' + start_x + ', L ' + final_y + ','+final_x+' Z';
        return output_string;
       })
    .attr('fill','#eee')

  // generate and position the row labels
  var row_label_obj = d3.select('#row_labels')
    .selectAll('.row_label_text')
    .data(row_nodes)
    .enter()
    .append('g')
    .attr('class','row_label_text')
    .attr('transform', function(d, i) { return "translate(0," + y_scale(i) + ")"; })
    .on('click', reorder_click_row );

  // append row label text 
  row_label_obj.append('text')
    .attr('y', x_scale.rangeBand() / 2)
    .attr('dy', '.32em')
    .attr('text-anchor','end')
    .style('font-size',default_fs+'px')
    .text(function(d, i) { return d.name; } ); 

  // run add double click zoom function 
  add_double_click(); 
};

// row function 
function row_function(row_data) {

  // generate tiles in the current row 
  cell =  d3.select(this)
    // data join 
    .selectAll(".cell")
    .data( row_data )
    .enter()
    .append("rect")
    .attr('class', 'cell')
    .attr("x", function(d) { return x_scale(d.pos_x); })
    .attr("width", x_scale.rangeBand())
    .attr("height", y_scale.rangeBand())
    .style("fill-opacity", function(d) { 
      // calculate output opacity using the opacity scale 
      output_opacity = opacity_scale( Math.abs(d.value) );
      return output_opacity ; 
    }) 
    // switch the color based on up/dn enrichment 
    .style('fill', function(d) { 
      return d.value > 0 ? '#FF0000' : '#1C86EE' ;
    } )
    .on("mouseover", function(p) {
      d3.selectAll(".row_label_text text").classed("active", function(d, i) { return i == p.pos_y; });
      d3.selectAll(".col_label_text text").classed("active", function(d, i) { return i == p.pos_x; });
    })
    .on("mouseout", function mouseout() {
      d3.selectAll("text").classed("active", false);
    })
};

function reorder_clust_rank(order_type) {

  // load orders 
  if ( order_type == 'clust' ){ 
    // order by enrichment 
    x_scale.domain(orders.clust_row);
    y_scale.domain(orders.clust_col);
  }
  else if (order_type == 'rank'){
    // order by enrichment 
    x_scale.domain(orders.rank_row);
    y_scale.domain(orders.rank_col);
  };

  // define the t variable as the transition function 
  var t = svg_obj.transition().duration(2500);

  // reorder matrix
  t.selectAll(".row")
    .attr("transform", function(d, i) { return "translate(0," + y_scale(i) + ")"; })
    .selectAll(".cell")
    .attr('x', function(d){ 
      return x_scale(d.pos_x);
    })

  // Move Row Labels
  d3.select('#row_labels').selectAll('.row_label_text')
    .transition().duration(2500)
    .attr('transform', function(d, i) { return 'translate(0,' + y_scale(i) + ')'; });

  // t.selectAll(".column")
  d3.select('#col_labels').selectAll(".col_label_text")
    .transition().duration(2500)
    .attr("transform", function(d, i) { 
      return "translate(" + x_scale(i) + ")rotate(-90)"; 
    });
};