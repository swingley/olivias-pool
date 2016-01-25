(function() {
  d3.json('data/phish-gaps.json', function(error, response) {
    if (error) { throw error; }

    response.data.reverse();

    makeTable(response);
    makeChart(response);
    makeGrid(response);
  });

  function makeTable(response) {
    // Flatten data into single array with all shows, most recent first.
    var allShows = response.data.map(function(s) {
      return s.shows;
    }).reduce(function(a, b) {
      return a.concat(b);
    });

    // Keep track of biggest gaps for every year.
    var highs = {};
    var lows = {};
    response.data.forEach(function(y) {
      highs[y.year] = d3.max(y.shows.map(function(s) { return s.gap; }));
      lows[y.year] = d3.min(y.shows.map(function(s) { return s.gap; }));
    });
    console.log('highs, lows', highs, lows);

    // For the table header.
    var columns = [
     { name: 'Show Date', cl: 'center' },
     { name: 'Gap', cl: 'center' },
    ];
    
    // Make each show a row in a table.
    var table = d3.select('#gaps-table div.page-content').append('table')
      .attr('class', 'mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp');
    table.append('thead').append('tr')
      .selectAll('th')
      .data(columns)
      .enter()
      .append('th')
      .attr('class', function(d) { return d.cl; })
      .text(function(d) { return d.name; });

    var rows = table.append('tbody')
      .selectAll('tr')
      .data(allShows)
      .enter()
      .append('tr')
      .attr('class', function(d) {
        var c = '';
        if ( highs[d.when.substring(0, 4)] == d.gap ) {
          c = 'big-gap';
        }
        if ( lows[d.when.substring(0, 4)] == d.gap ) {
          c = 'small-gap';
        }
        return c;
      });
    rows.append('td').html(function(d) { 
      return '<a href=\'http://phish.net/setlists/?d=' + 
          d.when + '\'>' + d.when + '</a>'; 
    });
    rows.append('td').html(function(d) { 
      return '<a href=\'http://phish.net/setlists/gapchart.php?d=' + 
          d.when + '\'>' + d.gap + '</a>'; 
    });
  }

  function makeChart(response) {
    var margin = {top: 20, right: 50, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 150 - margin.top - margin.bottom,
        barWidth = 2, offset = barWidth / 2,
        showDate = d3.time.format("%Y-%m-%d");

    response.data.forEach(function(gaps) {
      // console.log('gaps', gaps);
      gaps.year = +gaps.year;
      var x = d3.time.scale()
          .domain([new Date(gaps.year, 0, 1), new Date(gaps.year, 11, 31)])
          .range([0, width]);

      // Domain for y should be zero to max gap for the year.
      var yearMin = d3.min(gaps.shows.map(function(s) { return s.gap; }));
      var yearMax = d3.max(gaps.shows.map(function(s) { return s.gap; }));
      var y = d3.scale.linear()
          .domain([0, Math.ceil(yearMax)])
          .range([height, 0]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient('bottom')
          .tickFormat(d3.time.format('%B'));

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient('left')
          .ticks(3);

      var line = d3.svg.line()
          .x(function(d) { return x(showDate.parse(d.when)); })
          .y(function(d) { return y(d.gap); });

      var svg = d3.select('#gaps-chart div.page-content').append('svg')
          .attr('id', 'gaps-' + gaps.year)
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      var xContainer = svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);
      // Put x-axis labels to the right of each corresponding tick.
      xContainer.selectAll('text').style({ "text-anchor": "start" });
      // Add the year.
      var xTick = xContainer.select('text');
      var xTickPosY = +xTick.attr('y');
      var xTickDy = xTick.attr('dy');
      svg.append("text")
        .attr("x", -30)
        .attr("y", height + xTickPosY)
        .attr("dy", xTickDy)
        .style({ 
          "font-weight": "bold",
          "text-anchor": "start"
        })
        .text(gaps.year);

      svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

      var groups = svg.selectAll(".bar")
          .data(gaps.shows)
        .enter().append("g")
          .attr("class", function(d) {
            var b = "bar";
              if ( yearMax != yearMin) {
              if ( d.gap == yearMax ) {
                b = b + " blue";
              }
              if ( d.gap == yearMin ) {
                b = b + " black";
              }
            }
            return b;
          })
      var bars = groups.append("rect")
        .attr("x", function(d) { return x(showDate.parse(d.when)) })
        .attr("y", function(d) { return y(d.gap); })
        .attr("height", function(d) { return height - y(d.gap); })
        .attr("width", barWidth)
        .on("click", chartClick);

      function chartClick(d) {
        var parentElem = parentSvg(this).getBoundingClientRect();
        d3.select('.chart-tooltip').classed('hidden', false)
          .style("top", (parentElem.top + window.pageYOffset) + "px")
          .html(tooltipContent(d));
      }

      function parentSvg(node) {
        while ( node.nodeName !== 'svg' ) {
          node = node.parentNode;
        }
        return node;
      }

      function tooltipContent(d) {
        return '<a href=\'http://phish.net/setlists/?d=' + 
          d.when + '\'>' + d.when + '</a> had an average gap of  ' + 
          '<a href=\'http://phish.net/setlists/gapchart.php?d=' + 
          d.when + '\'>' + d.gap + '</a>';
      }
    });
  }

  function makeGrid(response) {
    var width = 960,
        height = 136,
        cellSize = 17; 

    var percent = d3.format(".1%"),
        format = d3.time.format("%Y-%m-%d");

    // Scale for what's being visualized.
    var color = d3.scale.quantize()
        .domain([0, 100])
        .range(d3.range(5).map(function(d) { return "q" + d + "-5"; }));

    var allShows = response.data.map(function(s) {
      return s.shows;
    }).reduce(function(a, b) {
      return a.concat(b);
    });

    var years = response.data.map(function(y) { return +y.year; });

    // One svg for each year.
    var svg = d3.select("#gaps-grid div.page-content").selectAll("svg")
        .data(years)
      .enter().append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "pinks")
      .append("g")
        .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

    // Year label.
    svg.append("text")
        .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
        .style("text-anchor", "middle")
        .text(function(d) { return d; });

    // Vertical line to indicate where a year starts/ends.
    svg.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", height)
      .attr("class", "year-line");

    // One square for each day.
    var rects = svg.selectAll(".day")
        .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("rect")
        .attr("class", "day")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", function(d) { return d3.time.weekOfYear(d) * cellSize + 12; })
        .attr("y", function(d) { return d.getDay() * cellSize; })
        .datum(format);

    var data = d3.nest()
      .key(function(d) { return d.when; })
      .rollup(function(d) { return d[0].gap; })
      .map(allShows);
    console.log('data', data);

    rects.filter(function(d) { return d in data; })
        .attr("class", function(d) { return "day " + color(data[d]); })
      // .append("title")
      //   .text(function(d) { return d + ": " + data[d]; });
        .on("click", gridClick);

    function gridClick(d) {
      var where = d3.mouse(this);
      var parentSvgRect = parentSvg(this).getBoundingClientRect();
      var left =( where[0] < 480 ) ? 730 : 150;
      var top = parentSvgRect.top + window.pageYOffset;
      console.log('left', parentSvgRect.left, left);
      d3.select('.grid-tooltip').classed('hidden', false)
        .style("left", left + "px")
        .style("top", top + "px")
        .html(tooltipContent(d));
    }

    function parentSvg(node) {
      while ( node.nodeName !== 'svg' ) {
        node = node.parentNode;
      }
      return node;
    }

    function tooltipContent(d) {
      return '<a href=\'http://phish.net/setlists/?d=' + 
        d + '\'>' + d + '</a> had an average gap of  ' + 
        '<a href=\'http://phish.net/setlists/gapchart.php?d=' + 
        d + '\'>' + data[d] + '</a>';
    }
  }

})();