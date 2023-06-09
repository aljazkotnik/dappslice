/*
dbsliceData is accessed through dbslice.dbsliceData. dbslice is declared by including it via a tag in index.html first. No bundling with this approach.
*/
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


// Both "plotMakeForD3Each" and "plotUpdateForD3Each" load the data, but only "plotUpdateForD3Each" sets the newData flag. What I really want is just to adjust the scales on the first time - just have it done in the make!!
var scales = {
	x: d3.scaleLinear(),
	y: d3.scaleLinear()
}

const line = d3.line()
	.x( d => scales.x( d[0] ) )
	.y( d => scales.y( d[1] ) );

var interaction = false;
var showdata

const d3LineContourComparison = {

    make : function () {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        const margin = ( this.layout.margin === undefined ) ? marginDefault : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth
        const svgHeight = this.layout.height;
		
		const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const gPlotArea = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr( "transform", `translate(${margin.left} , ${margin.top})`)
                .attr( "class", "plot-area" )
                .attr( "id", `plot-area-${this._prid}-${this._id}`);
				
		gPlotArea.append("g").attr("class", "datum")
		gPlotArea.append("g").attr("class", "comparison")


        if ( this.data == null || this.data == undefined ) {
            console.log ("in line plot - no data");
            return
        }

        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);
			
			
		// Both "plotMakeForD3Each" and "plotUpdateForD3Each" load the data, but only "plotUpdateForD3Each" sets the newData flag. What I really want is just to adjust the scales on the first time - just have it done in the make!!
		let extent = this.layout.extent;
		if(!extent){
			extent = this.data.series[0].data.extent
		}; // if
		scales = createScales(extent, [width, height])
		
		
		
		
		
		// ZOOMING
		const zoom = d3.zoom()
            .scaleExtent([0.5, Infinity])
            .on("zoom", zoomed);

		const svg = container.select("svg");
        svg.call(zoom);

		let obj = this;
        /*
		function zoomed(event) {
            const t = event.transform;
            scales.x.domain(t.rescaleX(scales.x).domain());
            scales.y.domain(t.rescaleY(scales.y).domain());
            
            obj.update()
        }
		*/
		
		var viewtransform = d3.zoomIdentity;
		function zoomed(event){
			
			// Get the current scales, and reshape them back to the origin.
			var t  = event.transform
			var t0 = viewtransform
			
			// Check if there was a manual change of the domain
			if(t0 == -1){
				t0 = t
			} // if
			
			// Hack to get the delta transformation.
			var dt = d3.zoomIdentity
			dt.k = t.k / t0.k 
			dt.x = t.x - t0.x 
			dt.y = t.y - t0.y
			
			viewtransform = t
			
				
			// dt is the transformation of the domain that should take place. So first we get the current range, we apply the view transformation, and then we convert that back to the domain.
			let xdomain = scales.x.range()
			  .map(dt.invertX, dt)
			  .map(scales.x.invert, scales.x)
			scales.x.domain( xdomain )
			
			let ydomain = scales.y.range()
			  .map(dt.invertY, dt)
			  .map(scales.y.invert, scales.y)
			scales.y.domain( ydomain )
			
			interaction = true;
			obj.update();
			
		} // zoomed
		
		
		

        this.update();

    },

    update : function () {

		// The zooming is returned out here, so the graphics are not re-done.
        if (this.layout.newData == false && dbslice.dbsliceData.windowResize == false && interaction==false) {
            return
        }
		

        const container = d3.select(`#${this.elementId}`);
        const svg = container.select("svg");
        const plotArea = svg.select(".plot-area");




        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        const margin = ( this.layout.margin === undefined ) ? marginDefault : this.layout.margin;

        

        const svgWidth = container.node().offsetWidth;
        const svgHeight = this.layout.height;

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;
		
		
		
		
		
		
		
       
		// This is the plotting function!!
		// function(){}
		
		// The data is fetched outside, in the update. For every new loaded file the update is called again. Contour data is an array of line specifications:
		// {level: <value>, points: [[<x>,<y>],...]}. It's stored within this.data.series because the "lineSeriesFromLines" onload data mutatation is used.
		
		// draw(plotArea.select("g.datum"), this.data.series[0].data.lines, line, d=>"orange")
		// draw(plotArea.select("g.comparison"), this.data.series[1].data.lines, line, d=>d.color)
		
		if(showdata){
				
			const g = d3.select(`#${this.elementId}`)
			  .select("svg")
			  .select(".plot-area")
			  .select("g.comparison")
			
			// Update the drawing
			draw(g, showdata.data.lines, line, d=>d.color)
			
			// Update the title.
			d3.select(`#plot-title-text-${this._prid}-${this._id}`).text(showdata.taskId)
			
			
		} // if
		
        

        
    

		// AXES
        const xAxis = d3.axisBottom( scales.x ).ticks(5);
        const yAxis = d3.axisLeft( scales.y );

        var gX = plotArea.select(".axis-x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                .attr( "transform", `translate(0,${height})` )
                .attr( "class", "axis-x")
                .call( xAxis );
            gX.append("text")
                .attr("class","x-axis-text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom-2)
                .attr("text-anchor", "end")
                .text(this.layout.xAxisLabel);
        } else {
            gX.call( xAxis );
            gX.select(".x-axis-text").attr("x", width)
        }

        var gY = plotArea.select(".axis-y");
        if ( gY.empty() ) {
            gY = plotArea.append("g")
                .attr( "class", "axis-y")
                .call( yAxis );
            gY.append("text")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0)
                    .attr("y", -margin.left + 15)
                    .attr("text-anchor", "end")
                    .text(this.layout.yAxisLabel);
        } else {
            gY.call( yAxis );
        }

       
		
		
		
		interaction = false;
        this.layout.newData = false;
    },

    highlightTasks : function() {

        let h = dbslice.dbsliceData.highlightTasks;

        if( h === undefined || 
		    h.length == 0) {
            // Clear highlighting
			
        } else {
			// Style highlighting
            // h[0] is the task that will be shown
			
			// Find the appropriate task and draw it.
			/*
			showdata = this.data.series.filter(d=>d.taskId==h[0])[0];
			interaction = true;
			this.update()
			*/
			let obj = this;
			fetch(`data/${ h[0] }/contour.json`)
			  .then(res=>res.json())
			  .then( (data) => {
				
				showdata = {taskId: h[0], data: data}; // obj.data.series.filter(d=>d.taskId==h[0])[0];
				interaction = true;
				obj.update()
			})
			
        } // if
		
		
    } // highlightTasks

};




function draw(g, data, makepath, coloraccessor){
	// Draw the contours.
		
	if(data){
			
		let lines = g.selectAll("path")
		  .data( data )
		  
		// First exit.
		lines.exit().remove();

		// Then update
		lines
		  .attr("d", d=>makepath(d.points))
		  .attr("stroke", coloraccessor)
		  .attr("stroke-width", d=>d.lineWidth ? d.lineWidth : 1 )
		  
		// Finally add new lines.
		lines.enter()
		  .append("path")
			.attr("stroke-width", d=>d.lineWidth ? d.lineWidth : 1 )
			.attr("stroke", coloraccessor)
			.attr("fill", "none")
			.attr("d", d=>makepath(d.points) )
			
		
	} else {
		d3.select(obj.node)
		  .select( gselector )
		  .selectAll("path")
		  .remove()
	} // if

} // draw 


function aspect(d,p){
	return (d[1]-d[0])/p
} // aspect


function createScales(extent, screen){
	// Make sure the scales preserve the required 1/1 value per pixel ratio.
	
	let v2p = Math.max( aspect(extent[0], screen[0]), 
	                    aspect(extent[1], screen[1]) );
	
	let xRange = [
	  (extent[0][1] + extent[0][0])/2 - v2p*screen[0]/2,
	  (extent[0][1] + extent[0][0])/2 + v2p*screen[0]/2,
	]
	
	let yRange = [
	  (extent[1][1] + extent[1][0])/2 - v2p*screen[1]/2,
	  (extent[1][1] + extent[1][0])/2 + v2p*screen[1]/2,
	]

	return {
		x: d3.scaleLinear().domain( xRange ).range([0,screen[0]]),
		y: d3.scaleLinear().domain( yRange ).range([screen[1],0])
	}
	
} // createScales





export { d3LineContourComparison };