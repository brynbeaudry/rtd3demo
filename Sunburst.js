/*************************************************************************
* Sunburst (Navigation wheel)
* Author: Jose Rodriguez (Based on the Mike's Bostock Bilevel partition)
* Copyright 2000-2016 Responsetek, Inc.
*************************************************************************/

//Global variables
//This array contains the colors to be used application wide, use them in order 0,1,2,3
var applicationColors = ["#F5A623", "#00ADF3", "#00975E", "#616161", "#AE53C0", "#FF7152", "#D22F43", "#50E3C2", "#FFD92F", "#A0E254", "#550000", "#FFAAAA", "#E55F95", "#AA3939", "#304E0E", "#FFF297", "#70AF28", "#E1F35A", "#121212", "#F57323", "#8B572A", "#4745FF", "#4AE0FF", "#BDF7F7", "#6900C4"];
//This array contains the colors to be used when selecting, graying out or disable an elements. Use the same index of "applicationColors"
var applicationColorsGrayout = ["#AB7318", "#0078A9", "#006941", "#434343", "#793986", "#B24E39", "#92202E", "#379E87", "#B29720", "#6F9D3A", "#3B0000", "#B27676", "#9F4268", "#762727", "#213609", "#B2A869", "#4E7A1B", "#9DA93E", "#0C0C0C", "#AB5018", "#613C1D", "#3130B2", "#339CB2", "#83ACAC", "#490088"];
var applicationEmptyDataColors = ["#ACACAC", "#C8C8C8", "#E5E5E5","#F3F3F3"]; //No Data Display Chart colors


var tooltip = "",
    colors = applicationColors.slice(),
    grayoutColors = applicationColorsGrayout.slice(),
		emptyDataColors = applicationEmptyDataColors.slice();
var scorePrecision;
//Create the chart using the passed in data and click event
/*function GenerateNavWheel(jsonData, cb, centertype, centerlabel, xlabel, ylabel, enterpriseData, scorePrecision) {}*/
function GenerateNavWheel(param) {
    //let's assume most of the param will be provided, since there is no default value for now
    var jsonData = param.jsonData;
    var cb = param.cb;
    var centertype = param.centertype;
    var centerlabel = param.centerlabel;
    var xlabel = param.xlabel;
    var ylabel = param.ylabel;
    var enterpriseData = param.enterpriseData;
    
    if (param.scorePrecision != undefined) {
        scorePrecision = param.scorePrecision;
        
    } else {
        scorePrecision = window.Settings.ScorePrecision;
        
    }
    
    //Get parents max-height
    var maxHeight = 300;//$("#sunburstchart").css('max-height');

    //Append the SVG object
    d3.select("#sunburstchart").append("svg")
        .attr("id", "navwheel")
        .attr("viewBox", "0 0 300 300")
        .attr("perserveAspectRatio", "xMinYMid")
        .style("max-height", maxHeight);

    //Local variables
    var margin = { top: 150, right: 150, bottom: 150, left: 150 },
        radius = Math.min(margin.top, margin.right, margin.bottom, margin.left) - 1,
        level0Tooltip = "",
        hue = d3.scale.category10();

    var luminance = d3.scale.sqrt()
        .domain([0, 1e6])
        .clamp(true)
        .range([90, 20]);

    d3.select("#sunburstchart").selectAll("div.tooltip")
		.each(function () {
			$(this).remove();
		});
    tooltip = d3.select("#sunburstchart").append("div")
        .attr("class", "tooltip")
        .style("display", "none");

    var svg = d3.select("#navwheel")
        .attr("width", margin.left + margin.right)
        .attr("height", margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var partition = d3.layout.partition()
        .sort(function(a, b) { return d3.ascending(a.name, b.name); })
        .size([2 * Math.PI, radius]);

    var arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .padAngle(.01)
        .padRadius(radius / 3)
        .innerRadius(function(d) { return radius / 3 * d.depth; })
        .outerRadius(function(d) { return radius / 3 * (d.depth + 1) - 1; });

    var root = SetDataForNavWheel(jsonData, centertype, centerlabel, xlabel, ylabel, enterpriseData, scorePrecision);

    // Compute the initial layout on the entire tree to sum sizes.
    // Also compute the full name and fill color for each node,
    // and stash the children so they can be restored as we descend.
    partition
        .value(function(d) { return d.yval; })
        .nodes(root)
        .forEach(function(d) {
            var col;
            d._children = d.children;
            d.sum = d.value;
            d.key = key(d);
            col = fill(d);
            d.fill = col;
            d.color = col;

            //Set center circle tooltip
            if (d.depth == 0) {
                level0Tooltip = '<span >' + d.name + '</span><br/>' + '<span style="color:#000000">\u25CF</span> ' + d.xlabel + ': <b>' + d.xval + '</b><br/>' + '<span style="color:#000000">\u25CF</span> ' + d.ylabel + ': <b>' + d.yval + '</b><br/>';
            }
        });

    //Now redefine the value function to use the previously-computed sum.
    partition
        .children(function(d, depth) { return depth < 2 ? d._children : null; })
        .value(function(d) { return d.sum; });

    //Create cirle object
    var center = svg.append("circle")
        .attr("r", radius / 3)
        .style("fill", "#F2F2F2");

    center.on("mouseover", function(d) {
        d3.select(this).transition().duration(0).style("fill", "#FFFFFF");
    });

    center.on("mouseout", function(d) {
        d3.select(this).transition().duration(0).style("fill", "#F2F2F2");
    });

    center.style("cursor", "default");

    //Draw the sunburst object
    //Set the transition when painted the object for the first time
    var path = svg.selectAll("path")
        .data(partition.nodes(root).slice(1))
        .enter().append("path")
        .attr("d", arc)
        .style("fill", function(d) { return d.fill; })
        .each(function(d) { this._current = updateArc(d); })
        .on("click", function(d) { cb(d.type, d.id, d.color, d.name); })
        .style("fill-opacity", "0");

    path.transition().duration(2000).style("fill-opacity", 1).each("end", SetTooltip);

    //Set the text for the center and use a transition to display
    svg.append('text')
        .attr("id", "idtextcircle")
        .attr("text-anchor", "middle")
        .text(root.name)
        .style("fill-opacity", "0")
        .style("cursor", "default")
        .on("mouseover", function(d) {
            tooltip.transition().duration(100).style("opacity", "0.9").style("background", "#FFFFFF");
            tooltip.html(level0Tooltip)
                .style("left", (d3.event.layerX) + "px")
                .style("top", (d3.event.layerY) + "px")
                .style("border-style", "solid")
                .style("border-width", "1px")
                .style("border-color", "#000000")
                .style("padding", "4px")
                .style("display", "block");
        })
        .on("mouseout", function(d) {
            tooltip.transition().duration(0).style("display", "none");
        });

    svg.transition().select("#idtextcircle").transition().duration(1500).style("fill-opacity", 1);


    //Responsive section (Resize the chart based on parent width\height)
    var chart = $("#navwheel"),
        aspect = chart.width() / chart.height(),
        container = chart.parent();

    $(window).on("resize", function() {
        var targetWidth = container.width();
        chart.attr("width", targetWidth);
        chart.attr("height", Math.round(targetWidth / aspect));
    }).trigger("resize");


    function zoomIn(p) {
        if (p.depth > 1) p = p.parent;
        if (!p.children) return;
        zoom(p, p);
    }

    function zoomOut(p) {
        if (!p.parent) return;
        zoom(p.parent, p);
    }

    // Zoom to the specified new root.
    function zoom(root, p) {
        if (document.documentElement.__transition__) return;

        // Rescale outside angles to match the new layout.
        var enterArc,
            exitArc,
            outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);

        function insideArc(d) {
            return p.key > d.key
                ? { depth: d.depth - 1, x: 0, dx: 0 } : p.key < d.key
                ? { depth: d.depth - 1, x: 2 * Math.PI, dx: 0 }
                : { depth: 0, x: 0, dx: 2 * Math.PI };
        }

        function outsideArc(d) {
            return { depth: d.depth + 1, x: outsideAngle(d.x), dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x) };
        }

        center.datum(root);

        // When zooming in, arcs enter from the outside and exit to the inside.
        // Entering outside arcs start from the old layout.
        if (root === p) enterArc = outsideArc, exitArc = insideArc, outsideAngle.range([p.x, p.x + p.dx]);

        path = path.data(partition.nodes(root).slice(1), function(d) { return d.key; });

        // When zooming out, arcs enter from the inside and exit to the outside.
        // Exiting outside arcs transition to the new layout.
        if (root !== p) enterArc = insideArc, exitArc = outsideArc, outsideAngle.range([p.x, p.x + p.dx]);

        d3.transition().duration(d3.event.altKey ? 7500 : 750).each(function() {
            path.exit().transition()
                .style("fill-opacity", function(d) { return d.depth === 1 + (root === p) ? 1 : 0; })
                .attrTween("d", function(d) { return arcTween.call(this, exitArc(d)); })
                .remove();

            path.enter().append("path")
                .style("fill-opacity", function(d) { return d.depth === 2 - (root === p) ? 1 : 0; })
                .style("fill", function(d) { return d.fill; })
                .on("click", zoomIn)
                .each(function(d) { this._current = enterArc(d); });

            path.transition()
                .style("fill-opacity", 1)
                .attrTween("d", function(d) { return arcTween.call(this, updateArc(d)); });
        });
    }
} //);

function key(d) {
    var k = [], p = d;
    while (p.depth) k.push(p.name), p = p.parent;
    return k.reverse().join(".");
}

//Set the color for each segment, assign based on level
function fill(d) {
    var p = d;
    var col = "";

    if (p.depth == 0) {
        col = "#F2F2F2";
    } else if (p.depth == 1) {
        if (p.color == "") {
            col = colors[0];
            colors.splice(0, 1);
        } else {
            col = p.color;
        }
    } else if (p.depth > 1) {
        col = p.parent.color;
    }
    return col;
}

function arcTween(b) {
    var i = d3.interpolate(this._current, b);
    this._current = i(0);
    return function(t) {
        return arc(i(t));
    };
}

function updateArc(d) {
    return { depth: d.depth, x: d.x, dx: d.dx };
}

//Set selection or unselection for each item
function SelectUnselectSunburstItem(type, id, disableTransition) {

    var transitionTime = 0;
    if (disableTransition === false) {
        transitionTime = 1000;
    }

    var sunburstChart = d3.select("#navwheel")
        .selectAll("path")
        //filter(function (d) { return d.type == type && d.id == id; })
        .transition().duration(transitionTime)
        .style("fill", function(d) {

            if (d.type == type && d.id == id) {
                var colorIndex = colors.indexOf(d.color)
                if (d.fill == d.color) {
                    d.fill = grayoutColors[colorIndex];
                } else {
                    d.fill = d.color;
                }
            }
            return d.fill;
        });
}

//Mouse over out/in effect for each segment	 
function SetTooltip(d) {
    var xval = scorePrecision == 0 ? Number(Math.round(d.xval)).toFixed(scorePrecision) : Number(d.xval).toFixed(scorePrecision);
    var eachPart = d3.select(this);
    eachPart
        .on("mouseover", function(d) {
            tooltip.transition().duration(100).style("opacity", "0.7").style("background", "#FFFFFF");
            tooltip.html('<span >' + d.name + '</span><br/>' + '<span style="color:black">\u25CF</span> ' + d.xlabel + ': <b>' + xval + '</b><br/>' + '<span style="color:black">\u25CF</span> ' + d.ylabel + ': <b>' + d.yval + '</b><br/>')
                .style("left", (d3.event.layerX) + 5 + "px")
                .style("top", (d3.event.layerY) + 5 + "px")
                .style("white-space", "nowrap")
                .style("border-style", "solid")
                .style("border-width", "1px")
                .style("border-color", d.fill)
                .style("padding", "4px")
                .style("display", "block");

            eachPart.attr("r", 10).transition().duration(150).style("opacity", ".5");
        })
        .on("mouseout", function(d) {
            tooltip.transition().duration(1).style("display", "none"); //.style("opacity", 0);
            eachPart.attr("r", 10).transition().duration(100).style("opacity", "1");
        });
}

//Convert the JSON in a readable format for the chart
function SetDataForNavWheel(data, centertype, centerlabel, xlabel, ylabel, enterprise, scorePrecision) {
    var jsonData = data;//JSON.parse(data);
    //Variable declaration
    var firstLevelData = [],
        secondLevelData = [],
        i,
        j,
        dataLenLevel1,
        dataLenLevel2,
        chartData = [],
        firstLevelID,
        jasonDataLevel1,
        //jasonDataLevel2,
        //color,
        //brightness,
        overallX = 0,
        overallY = 0,
        firstLevelCount = 0;

    //Initialize the variables
    jasonDataLevel1 = jsonData[0];
    //jasonDataLevel2 = jsonData[1];
    dataLenLevel1 = jasonDataLevel1.length;

    // Build the data arrays
    for (i = 0; i < dataLenLevel1; i += 1) {
        if (jasonDataLevel1[i].xval != "-999") {
            firstLevelID = jasonDataLevel1[i].id;

            //Add second level data - Collection
            var filteredLevel2 = GetElementsByParentID(jsonData[1], firstLevelID);
            dataLenLevel2 = filteredLevel2.length;
            for (j = 0; j < dataLenLevel2; j += 1) {
                if (filteredLevel2[j].xval != "-999") {
                    //brightness = 0.2 - (j / dataLenLevel2) / 5;
                    var result = CreateLevelData(filteredLevel2[j], scorePrecision, firstLevelCount, undefined);
                    if (result != null) {
                        secondLevelData.push(result);
                    }
                }
            }

            //Add first level data - Template
            firstLevelData.push(CreateLevelData(jasonDataLevel1[i], scorePrecision, firstLevelCount, secondLevelData));

            overallX = overallX + Number(jasonDataLevel1[i].xval);
            overallY = overallY + parseInt(Number(jasonDataLevel1[i].yval));
            secondLevelData = [];
            firstLevelCount++;
        }
    }

    //Set the overallx average and apply score precision here
    if (firstLevelCount === 0)
        overallX = 0;
    else
        overallX = overallX / firstLevelCount;
    if (enterprise != null && enterprise.length !== 0) {
        overallY = enterprise[0].yval;
        overallX = enterprise[0].xval;
    }

    //Create the level 0 - Center
    //To-do: should we push data for enterprise if there is no data at all ?
    chartData.push({
        name: centerlabel,
        yval: parseInt(Number(overallY)), //Volume
        xval: scorePrecision == 0 ? Number(Math.round(overallX)).toFixed(scorePrecision) : Number(overallX).toFixed(scorePrecision), //Score
        ylabel: ylabel,
        xlabel: xlabel,
        color: "",
        type: centertype,
        id: "",
        rval: "",
        children: firstLevelData
    });

    //var testData = JSON.stringify(chartData);

    return chartData[0];
}

function CreateLevelData(levelData, scorePrecision, firstLevelCount, childrenData) {

    var result = null;
    try 
    {
        result = {
            name: levelData.name,
            id: ParseInt(levelData.id),
            type: ParseInt(levelData.type),
            yval: ParseInt(levelData.yval), //Volume
            xval:scorePrecision == 0 ? Number(Math.round(levelData.xval)).toFixed(scorePrecision) : Number(levelData.xval).toFixed(scorePrecision), //Score
            rval: "", //Not in use
            ylabel: levelData.ylabel,
            xlabel: levelData.xlabel,
            rlabel: levelData.ylabel,
            color: applicationColors[firstLevelCount],
            parentrefid: ParseInt(levelData.parentrefid),
            parentreftype: ParseInt(levelData.parentreftype),
            children: childrenData
        };
    }
    catch (e) { }

    return result;
}

//This function should be moved to a common js file, like app.js / master.js
function ParseInt(obj) {
    var result = 0;
    if (obj && !isNaN(obj)) {
        result = parseInt(Number(obj));
    }
    return result;
}


function GetElementsByParentID(ar, parentID) {
    var j, data = [];

    for (j = 0; j < ar.length; j += 1) {
        if (ar[j].parentrefid == parentID) {
            data.push(ar[j]);
        }
    }

    return data;
}

//Function for testing
function DisplayAlert(data) {
    alert("Name: " + data.name + " Score: " + data.xval);
   }


function GenerateEmptyNavWheel() {

	//Get parents max-height
	var maxHeight = $("#sunburstchart").css('max-height');

	//Append the SVG object
	d3.select("#sunburstchart").append("svg")
		.attr("id", "emptynavwheel")
		.attr("viewBox", "0 0 300 300")
		.attr("perserveAspectRatio", "xMinYMid")
		.style("max-height", maxHeight);

	//Local variables
	var margin = { top: 150, right: 150, bottom: 150, left: 150 },
	    radius = Math.min(margin.top, margin.right, margin.bottom, margin.left) - 1;

	var svg = d3.select("#emptynavwheel")
		.attr("width", margin.left + margin.right)
		.attr("height", margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var partition = d3.layout.partition()
		.sort(function(a, b) { return d3.ascending(a.name, b.name); })
		.size([2 * Math.PI, radius]);

	var arc1 = d3.svg.arc()
		.startAngle(0)
		.endAngle(2 * Math.PI)
		.innerRadius(radius / 3)
		.outerRadius(radius / 3 * 2 - 1);

	var arc2 = d3.svg.arc()
		.startAngle(0)
		.endAngle(2 * Math.PI)
		.innerRadius(radius / 3 * 2)
		.outerRadius(radius / 3 * (2 + 1) - 1);

	//Now redefine the value function to use the previously-computed sum.
	partition
		.children(function(d, depth) { return depth < 2 ? d._children : null; })
		.value(function(d) { return d.sum; });

	//Create cirle object
	var center = svg.append("circle")
		.attr("r", radius / 3)
		.style("fill", "#FFF");

	center.style("cursor", "default");

	//Set the text for the center and use a transition to display
	svg.append('text')
		.attr("id", "idtextcircle")
		.attr("text-anchor", "middle")
		.attr("fill", emptyDataColors[0])
		.style("fill-opacity", "0")
		.append('tspan')
		.text("No Data")
		.attr("x", '0')
		.attr("dy",'-0.5em');

	svg.select('text')
		.append('tspan')
		.text("to Display")
		.attr("x", '0')
		.attr("dy", '1.4em');

	svg.append('path')
		.attr("d", arc1)
		.attr("fill", emptyDataColors[1])
		.style("border-style", "solid")
		.style("border-width", "1px")
		.style("border-color", "#000000");

	svg.append('path')
		.attr("d", arc2)
		.attr("fill", emptyDataColors[2])
		.style("border-style", "solid")
		.style("border-width", "1px")
		.style("border-color", "#000000");

	svg.transition().select("#idtextcircle").transition().duration(1500).style("fill-opacity", 1);


	//Responsive section (Resize the chart based on parent width\height)
	var chart = $("#emptynavwheel"),
	    aspect = chart.width() / chart.height(),
	    container = chart.parent();

	$(window).on("resize", function() {
		var targetWidth = container.width();
		chart.attr("width", targetWidth);
		chart.attr("height", Math.round(targetWidth / aspect));
	}).trigger("resize");


	function zoomIn(p) {
		if (p.depth > 1) p = p.parent;
		if (!p.children) return;
		zoom(p, p);
	}

	function zoomOut(p) {
		if (!p.parent) return;
		zoom(p.parent, p);
	}

	// Zoom to the specified new root.
	function zoom(root, p) {
		if (document.documentElement.__transition__) return;

		// Rescale outside angles to match the new layout.
		var enterArc,
		    exitArc,
		    outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);

		function insideArc(d) {
			return p.key > d.key
				? { depth: d.depth - 1, x: 0, dx: 0 } : p.key < d.key
				? { depth: d.depth - 1, x: 2 * Math.PI, dx: 0 }
				: { depth: 0, x: 0, dx: 2 * Math.PI };
		}

		function outsideArc(d) {
			return { depth: d.depth + 1, x: outsideAngle(d.x), dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x) };
		}

		center.datum(root);

		// When zooming in, arcs enter from the outside and exit to the inside.
		// Entering outside arcs start from the old layout.
		if (root === p) enterArc = outsideArc, exitArc = insideArc, outsideAngle.range([p.x, p.x + p.dx]);

		path = path.data(partition.nodes(root).slice(1), function(d) { return d.key; });

		// When zooming out, arcs enter from the inside and exit to the outside.
		// Exiting outside arcs transition to the new layout.
		if (root !== p) enterArc = insideArc, exitArc = outsideArc, outsideAngle.range([p.x, p.x + p.dx]);

		d3.transition().duration(d3.event.altKey ? 7500 : 750).each(function() {
			path.exit().transition()
				.style("fill-opacity", function(d) { return d.depth === 1 + (root === p) ? 1 : 0; })
				.attrTween("d", function(d) { return arcTween.call(this, exitArc(d)); })
				.remove();

			path.enter().append("path")
				.style("fill-opacity", function(d) { return d.depth === 2 - (root === p) ? 1 : 0; })
				.style("fill", function(d) { return d.fill; })
				.on("click", zoomIn)
				.each(function(d) { this._current = enterArc(d); });

			path.transition()
				.style("fill-opacity", 1)
				.attrTween("d", function(d) { return arcTween.call(this, updateArc(d)); });
		});
	}
}