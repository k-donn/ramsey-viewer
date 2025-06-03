"use client";

import { Container, InputGroup, Form, Row, Col } from "react-bootstrap";
import InputGroupText from "react-bootstrap/esm/InputGroupText";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type RamseyType =
	| "r33"
	| "r34"
	| "r35"
	| "r36"
	| "r37"
	| "r38"
	| "r39"
	| "r44"
	| "r45";

type Vertex = {
	x: number;
	y: number;
	fx: number | null;
	fy: number | null;
};
type Edge = {
	source: number;
	target: number;
};

const width = 700,
	height = 700,
	radius = 270,
	vertexRadius = 20;

const vertsLookup: Record<RamseyType, number> = {
	r33: 6,
	r34: 9,
	r35: 14,
	r36: 18,
	r37: 23,
	r38: 28,
	r39: 36,
	r44: 18,
	r45: 25,
};

export default function Main() {
	const [ramseyType, setRamseyType] = useState<RamseyType>("r34");
	const [graphId, setGraphId] = useState(1);

	const [vertices, setVertices] = useState<Vertex[]>([]);
	const svgRef = useRef<SVGSVGElement | null>(null);

	function getEdges(vertices: Vertex[]) {
		const edges: Edge[] = [];
		for (let i = 0; i < vertices.length; i++) {
			for (let j = i + 1; j < vertices.length; j++) {
				edges.push({ source: i, target: j });
			}
		}
		return edges;
	}

	useEffect(() => {
		const vertsCount = vertsLookup[ramseyType];
		const centerX = width / 2;
		const centerY = height / 2;
		const newVertices = d3.range(vertsCount).map((i) => {
			const angle = (2 * Math.PI * i) / vertsCount;
			return {
				x: centerX + radius * Math.cos(angle),
				y: centerY + radius * Math.sin(angle),
			} as Vertex;
		});
		setVertices(newVertices);
	}, [ramseyType]);

	useEffect(() => {
		if (vertices.length === 0) return;

		const edges = getEdges(vertices);

		const simulation = d3
			.forceSimulation(vertices)
			.force("link", d3.forceLink(edges).distance(400).strength(0.25))
			.force("charge", d3.forceManyBody().strength(-40))
			.force("center", d3.forceCenter(width / 2, height / 2))
			.on("tick", ticked);

		const svg = d3.select(svgRef.current);
		svg.selectAll("*").remove();

		const link = svg
			.append("g")
			.attr("stroke", "#bbb")
			.attr("stroke-width", 2)
			.selectAll("line")
			.data(edges)
			.enter()
			.append("line");

		const node = svg
			.append("g")
			.selectAll("circle")
			.data(vertices)
			.enter()
			.append("circle")
			.attr("r", vertexRadius)
			.attr("fill", "#1976d2")
			.call(
				d3
					.drag<SVGCircleElement, Vertex>()
					.on("start", function (event, d) {
						if (!event.active)
							simulation.alphaTarget(0.3).restart();
						d.fx = d.x;
						d.fy = d.y;
					})
					.on("drag", function (event, d) {
						d.fx = event.x;
						d.fy = event.y;
					})
					.on("end", function (event, d) {
						if (!event.active) simulation.alphaTarget(0);
						d.fx = null;
						d.fy = null;
					})
			);

		function ticked() {
			link.attr("x1", (d) => vertices[d.source.index].x)
				.attr("y1", (d) => vertices[d.source.index].y)
				.attr("x2", (d) => vertices[d.target.index].x)
				.attr("y2", (d) => vertices[d.target.index].y);

			node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
		}

		return () => {
			simulation.stop();
		};
	}, [vertices, ramseyType, graphId]);

	function onGraphIdChange(e: ChangeEvent<HTMLInputElement>) {
		e.preventDefault();
		const newGraphId = clampGraphId(parseInt(e.target.value), ramseyType);
		setGraphId(newGraphId);
	}

	function onRamseyChange(e: ChangeEvent<HTMLSelectElement>) {
		e.preventDefault();
		const ramseyStr = e.target.value as RamseyType;
		setRamseyType(ramseyStr);
		setGraphId(clampGraphId(graphId, ramseyStr));
	}

	function getColoringsCount(ramseyStr: RamseyType): number {
		const vertsCount = vertsLookup[ramseyStr];
		return Math.pow(2, ((vertsCount - 1) * vertsCount) / 2);
	}

	function clampGraphId(possibleId: number, ramseyStr: RamseyType): number {
		if (
			possibleId < 1 ||
			Number.isNaN(possibleId) ||
			possibleId === undefined
		) {
			return 1;
		} else if (possibleId > getColoringsCount(ramseyStr)) {
			return getColoringsCount(ramseyStr);
		} else {
			return possibleId;
		}
	}

	return (
		<Container className="py-4">
			<h1 className="mb-4">Ramsey Number Visualization</h1>
			<Form className="mb-4">
				<Row className="g-2">
					<Col>
						<Form.Select
							defaultValue={ramseyType}
							onChange={onRamseyChange}
						>
							<option value="r33">R(3,3)</option>
							<option value="r34">R(3,4)</option>
							<option value="r35">R(3,5)</option>
							<option value="r36">R(3,6)</option>
							<option value="r37">R(3,7)</option>
							<option value="r38">R(3,8)</option>
							<option value="r39">R(3,9)</option>
							<option value="r44">R(4,4)</option>
							<option value="r45">R(4,5)</option>
						</Form.Select>
					</Col>
					<Col>
						<InputGroup>
							<InputGroupText>#</InputGroupText>
							<Form.Control
								type="number"
								placeholder="Graph id#"
								onChange={onGraphIdChange}
								value={graphId}
							></Form.Control>
							<InputGroupText>
								of {getColoringsCount(ramseyType)}
							</InputGroupText>
						</InputGroup>
					</Col>
				</Row>
			</Form>
			<div
				id="graphArea"
				className="bg-white rounded shadow p-3 text-center"
			>
				<svg
					ref={svgRef}
					id="graphSvg"
					width={width}
					height={height}
					style={{ touchAction: "none" }}
				></svg>
			</div>
		</Container>
	);
}
