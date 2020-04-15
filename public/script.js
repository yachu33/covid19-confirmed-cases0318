const svg = d3.select('body')
            .append('svg')
            .attr('width', 1200)
            .attr('height', 900)

svg.append("text")
  .attr("x", 425)
  .attr("y", 50)
  .style("font-size", "25px")
  .style("font-family", "Verdana")
  .text("COVID-19 Confirmed Cases on 18/03/2020");

const projection = d3.geoMercator()
                    .scale(150)
                    .center([0, 25]);

const path = d3.geoPath().projection(projection);

const tooltip = d3
  .tip()
  .attr("class", "tooltip")
  .html(function(selected) {
    return (
      "<strong style='font-family:Verdana;'>" +
      selected.country_name +
      "<br>" +
      "Confirmed:<span>" +
      d3.format(",d")(selected.cases) +
      "</span></strong>"
    );
  });
svg.call(tooltip);
const colorScale = d3
  .scaleThreshold()
  .domain([10, 100, 300, 1000, 5000, 10000, 20000, 30000, 50000])
  .range(d3.schemeReds[9]);

const yLegend = d3
  .scaleLinear()
  .domain([0, 100, 300, 1000, 5000, 10000, 20000, 30000, 50000])
  .range([58, 58+26, 58+26*2, 58+26*3, 58+26*4, 58+26*5, 58+26*6, 58+26*7, 58+26*8, 58+26*9, 58+26*10]);

const g = svg.append("g");

g.selectAll("rect")
  .data(
    colorScale.range().map(function(d) {
        d = colorScale.invertExtent(d);
        // console.log(d)
        if (d[0] == null) d[0] = yLegend.domain()[0];
        if (d[1] == null) d[1] = yLegend.domain()[1];
        return d;
    })
  )
  .enter()
  .append("rect")
  .attr("height", 26)
  .attr("x", -26)
  .attr("y", function(d, i) {
    return i*26 + 55;
  })
  .attr("width", 23)
  .attr("fill", function(d) {
    // console.log(d)
    return colorScale(d[0]);
  });


g.append("text")
  .attr("x", -42)
  .attr("y", 48)
  .attr("fill", "#000")
  .attr("text-anchor", "start")
  .attr("font-size", "11px")
  .attr("font-family", "Verdana")
  .text("Confirmed Cases");

g.attr("transform", "translate(1100, 50)")
  .call(
    d3.axisRight(yLegend)
      .tickSize(0)
      .tickFormat(function(y, i) {
        // console.log(colorScale.dom);
        if (i > 8) return "";
        if (i == 0) return `≤${y}`;
        if (i == 8) return `≥${y}`;
        return y;
      })
      .tickValues(colorScale.domain())
  )
  .select(".domain")
  .remove();

let g2 = svg.append("g")
            .attr("transform", "translate(50,200)");
g2.append("path")
  .attr("d", path());
Promise.all([
  d3.csv("covid19.csv"),
  d3.json("https://unpkg.com/world-atlas@1.1.4/world/50m.json")
])
  .then(([covidData, topoJSONdata]) => {
    // console.log(covidData);
    const country = d => {
      // console.log(d.id)
      return covidData.find(item => item.iso_num == d.id);
    };
    const countries = topojson.feature(
      topoJSONdata,
      topoJSONdata.objects.countries
    );
    // console.log(countries.features)
    g2.selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", d => {
        const selected = country(d);
        if (selected) {
          return selected.cases != 0 ? colorScale(+selected.cases) : "#E8E0DE";
        }
      })
      .style("stroke", "none")
      .attr("class", "country")
      .style("opacity", 1)
      .on("mouseover", function(d) {
        const selected = country(d);
        d3.select(this)
          .transition()
          .style("opacity", 0.8);
        d3.select(this)
          .transition()
          .style("opacity", 1)
          .style("stroke", "grey");
        if (selected.country_name) {
          tooltip.show(selected);
        }
      })
      .on("mouseleave", function(d) {
        d3.select(this)
          .transition()
          .style("opacity", 0.8);
        d3.select(this)
          .transition()
          .style("stroke", "none");
        tooltip.hide();
      });
  })
  .catch(reason => {
    svg.append("svg:a")
    .attr("xlink:href", "https://covid-19-0318.firebaseapp.com/")
    .append("svg:text")
    .style('fill', 'blue')
    .text('Use web server or Click Here')
    .attr("x", 700)
    .attr("y", 120)
    .attr("text-anchor", "middle");
    // .html('<a href="https://covid-19-0318.firebaseapp.com/">Click Here</a>');
  });

