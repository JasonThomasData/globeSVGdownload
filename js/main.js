queue()
  .defer(d3.json, "world-110m.json")
  .defer(d3.tsv, "world-110m-country-names.tsv")
  .await(ready);

//Main function
function ready(error, world, countryData) {
  var windowInnerHeight = window.innerHeight - $('#topExplainerContent').height() - 100;
  var windowInnerWidth = $('#contentContainer').width();

  var globeState ={
    countries: topojson.feature(world, world.objects.countries).features,
    globeSize: d3.min([windowInnerHeight, windowInnerWidth]),
    sens: 0.25,
    focused: null
  }

  var dataStore = {
    countryById: {},
    countryList: d3.select("body select")
  }

  //Setting projection
  var projection = d3.geo.orthographic()
    .scale(globeState.globeSize / 2)
    .rotate([0, 0])
    .translate([globeState.globeSize / 2, globeState.globeSize / 2])
    .clipAngle(90);

  var drag = d3.behavior.drag()
      .origin(function() { var r = projection.rotate(); return {x: r[0] / globeState.sens, y: -r[1] / globeState.sens}; })
      .on("drag", function() {
        var rotate = projection.rotate();
        projection.rotate([d3.event.x * globeState.sens, -d3.event.y * globeState.sens, rotate[2]]);
        svg.selectAll("path.land").attr("d", path);
        svg.selectAll(".focused").classed("focused", globeState.focused = false);
      })

  var path = d3.geo.path()
    .projection(projection);

  //SVG container
  var svg = d3.select("#contentContainer").append("svg")
    .attr("width", globeState.globeSize)
    .attr("height", globeState.globeSize)

  var countryTooltip = d3.select("body").append("div").attr("class", "countryTooltip");

  var water = svg.append("path")
    .datum({type: "Sphere"})
    .attr("class", "water")
    .attr("d", path)
    //.call(zoom)
    .call(drag)

  //Adding countries to select
  countryData.forEach(function(d) {
    dataStore.countryById[d.id] = d.name;
    option = dataStore.countryList.append("option");
    option.text(d.name);
    option.property("value", d.id);
  });

  //Drawing countries on the globe
  var world = svg.selectAll("path.land")
    .data(globeState.countries)
    .enter().append("path")
    .attr("class", "land")
    .attr("d", path)
    //.call(zoom)
    .call(drag)
    .on("mouseover", function(d) {
      countryTooltip.text(dataStore.countryById[d.id])
        .style("left", (d3.event.pageX + 7) + "px")
        .style("top", (d3.event.pageY - 15) + "px")
        .style("display", "block")
        .style("opacity", 1);
    })
    .on("click", function(d) {
      var focusedCountry = selectCountry(globeState.countries, d.id);
      changeFocusCountry(focusedCountry);
      $("select").val(d.id);
      //zoom()
    })
    .on("mouseout", function(d) {
      countryTooltip.style("opacity", 0)
        .style("display", "none");
    })
    .on("mousemove", function(d) {
      countryTooltip.style("left", (d3.event.pageX + 7) + "px")
      .style("top", (d3.event.pageY - 15) + "px");
    });

  function changeFocusCountry(focusedCountry){
    var rotate = projection.rotate();
    var p = d3.geo.centroid(focusedCountry);
    svg.selectAll(".focused").classed("focused", globeState.focused = false);
    transition(p, focusedCountry)
  }

  function selectCountry(countries, selectValue) {
    for(var i = 0, l = countries.length; i < l; i++) {
      if(countries[i].id == selectValue) {return countries[i];}
    }
  };

  function getFocussedCountryHtml(){
    $.get('svgTemplate.txt', function(templateSVG){  
      var relevantSVG = d3.select("path.land.focused").node().outerHTML
      var fileToSave = templateSVG.replace('< -- path goes here -- >', relevantSVG)
      var blob = new Blob([fileToSave], {type: "text/plain;charset=utf-8"});
      var fileName = $("select option:selected").text();
      saveAs(blob, fileName + '.SVG');
    })
  }

  function transition(p, focusedCountry) {
    d3.transition()
      .duration(500)
      .tween("rotate", function() {
        var r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
        return function(t) {
        projection.rotate(r(t));
        svg.selectAll("path").attr("d", path)
          .classed("focused", function(d, i) { return d.id == focusedCountry.id ? globeState.focused = d : false; });
        };
      })
  }

  d3.select('#savePath').on('click', function(){
    getFocussedCountryHtml()
  })

  d3.select("select").on("change", function() {
    var focusedCountry = selectCountry(globeState.countries, this.value)
    changeFocusCountry(focusedCountry)
  });

};