function change_focus_country(focusedCountry, projection){
  rotate = projection.rotate();
  var p = d3.geo.centroid(focusedCountry);
  svg.selectAll(".focused").classed("focused", datavizState.focused = false);
  transition(p, focusedCountry)
}

function select_country(cnt, select_value) {
  for(var i = 0, l = cnt.length; i < l; i++) {
    if(cnt[i].id == select_value) {return cnt[i];}
  }
};

function get_focussed_country_html(){
  $.get('svgTemplate.txt', function(templateSVG){  
    var relevantSVG = d3.select("path.land.focused").node().outerHTML
    var fileToSave = templateSVG.replace('< -- path goes here -- >', relevantSVG)
    var blob = new Blob([fileToSave], {type: "text/plain;charset=utf-8"});
    var fileName = $("select option:selected").text();
    saveAs(blob, fileName + '.SVG');
  })
}