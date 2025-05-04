import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getNodes } from '../utils/getNodes';
import { getLinks } from '../utils/getLinks';
import { drag } from '../utils/drag';

export function Graph(props) {
    const { margin, svg_width, svg_height, data } = props;

    const nodes = getNodes({ rawData: data });
    const links = getLinks({ rawData: data });

    const width = svg_width - margin.left - margin.right;
    const height = svg_height - margin.top - margin.bottom;

    const lineWidth = d3.scaleLinear().range([2, 6]).domain([d3.min(links, d => d.value), d3.max(links, d => d.value)]);
    const radius = d3.scaleLinear().range([10, 50])
        .domain([d3.min(nodes, d => d.value), d3.max(nodes, d => d.value)]);
    const color = d3.scaleOrdinal().range(d3.schemeCategory10).domain(nodes.map(d => d.name));

    const d3Selection = useRef();

    useEffect(() => {
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.name).distance(d => 20 / d.value))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("y", d3.forceY([height / 2]).strength(0.02))
            .force("collide", d3.forceCollide().radius(d => radius(d.value) + 20))
            .tick(3000);

        let g = d3.select(d3Selection.current);
        g.selectAll("*").remove();

        // 添加图例到左上角
        const legend = g.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const uniqueNames = Array.from(new Set(nodes.map(d => d.name)));
        legend.selectAll("g")
            .data(uniqueNames)
            .enter()
            .append("g")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`)
            .each(function(d) {
                const g = d3.select(this);
                g.append("rect")
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("fill", color(d))
                    .attr("x", 0)
                    .attr("y", -6);
                g.append("text")
                    .text(d)
                    .attr("x", 15)
                    .attr("y", 5)
                    .style("font-size", "12px")
                    .attr("fill", "#333");
            });

        // building tooltip
        let tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("background-color", "white")
            .style("position", "absolute")
            .style("padding", "5px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-weight", "normal")
            .style("font-size", "12px");

        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => lineWidth(d.value));

        const node = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .enter();

        const point = node.append("circle")
            .attr("r", d => radius(d.value))
            .attr("fill", d => color(d.name))
            .call(drag(simulation))
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(`${d.name}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            point
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });
    }, [width, height]);

    return (
        <svg
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
        >
            <g ref={d3Selection} transform={`translate(${margin.left}, ${margin.top})`}></g>
        </svg>
    );
}