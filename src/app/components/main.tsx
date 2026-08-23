"use client";

import { Container, InputGroup, Form, Row, Col } from "react-bootstrap";
import InputGroupText from "react-bootstrap/esm/InputGroupText";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import * as d3 from "d3";

function decimalToBinaryString(n: number, k: number) {
	return n.toString(2).padStart(k, "0");
}

function findKmn(
	edges: Edge[],
	vertsCount: number,
	m: number,
	n: number
): { redKEdges: Edge[]; blueKEdges: Edge[] } {
	// Build adjacency matrices for red and blue edges
	const redAdj = Array.from({ length: vertsCount }, () =>
		Array(vertsCount).fill(false)
	);
	const blueAdj = Array.from({ length: vertsCount }, () =>
		Array(vertsCount).fill(false)
	);
	edges.forEach((e) => {
		if (e.color === "red") {
			redAdj[e.source][e.target] = true;
			redAdj[e.target][e.source] = true;
		} else {
			blueAdj[e.source][e.target] = true;
			blueAdj[e.target][e.source] = true;
		}
	});

	// Returns the vertices part of the clique
	function findClique(adj: boolean[][], size: number): number[] | null {
		function helper(start: number, clique: number[]): number[] | null {
			if (clique.length === size) return clique.slice();
			for (let v = start; v < vertsCount; v++) {
				if (clique.every((u) => adj[u][v])) {
					const found = helper(v + 1, clique.concat(v));
					if (found) return found;
				}
			}
			return null;
		}
		return helper(0, []);
	}

	const redKVerts = findClique(redAdj, m);
	const blueKVerts = findClique(blueAdj, n);
	const redKEdges = [];
	const blueKEdges = [];

	if (redKVerts) {
		for (let fromIdx = 0; fromIdx < redKVerts.length; fromIdx++) {
			for (let toIdx = fromIdx + 1; toIdx < redKVerts.length; toIdx++) {
				redKEdges.push({
					source: redKVerts[fromIdx],
					target: redKVerts[toIdx],
				} as Edge);
			}
		}
	}

	if (blueKVerts) {
		for (let fromIdx = 0; fromIdx < blueKVerts.length; fromIdx++) {
			for (let toIdx = fromIdx + 1; toIdx < blueKVerts.length; toIdx++) {
				blueKEdges.push({
					source: blueKVerts[fromIdx],
					target: blueKVerts[toIdx],
				} as Edge);
			}
		}
	}

	return { redKEdges, blueKEdges };
}

function getEdges(vertices: Vertex[], colorBits: string) {
	const edges: Edge[] = [];
	let edgeId = 0;
	for (let i = 0; i < vertices.length; i++) {
		for (let j = i + 1; j < vertices.length; j++) {
			edges.push({
				source: i,
				target: j,
				color: parseInt(colorBits[colorBits.length - 1 - edgeId])
					? "red"
					: "blue",
			} as Edge);
			edgeId++;
		}
	}
	return edges;
}

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
	k_red: boolean;
	k_blue: boolean;
};
type Edge = {
	source: number;
	target: number;
	color: "red" | "blue";
	k_blue: boolean | null;
	k_red: boolean | null;
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

	const svgRef = useRef<SVGSVGElement | null>(null);

	useEffect(() => {
		const vertsCount = vertsLookup[ramseyType];
		const centerX = width / 2;
		const centerY = height / 2;
		const vertices = d3.range(vertsCount).map((i) => {
			const angle = (2 * Math.PI * i) / vertsCount;
			return {
				x: centerX + radius * Math.cos(angle),
				y: centerY + radius * Math.sin(angle),
			} as Vertex;
		});

		const edgeCount = ((vertsCount - 1) * vertsCount) / 2;

		const colorBits = decimalToBinaryString(graphId - 1, edgeCount);

		const edges = getEdges(vertices, colorBits);

		const cliques = findKmn(
			edges,
			vertsCount,
			parseInt(ramseyType[1]),
			parseInt(ramseyType[2])
		);

		for (let edgeIdx = 0; edgeIdx < edges.length; edgeIdx++) {
			const isBluePart = cliques.blueKEdges.some(
				(e) =>
					e.source === edges[edgeIdx].source &&
					e.target === edges[edgeIdx].target
			);
			const isRedPart = cliques.redKEdges.some(
				(e) =>
					e.source === edges[edgeIdx].source &&
					e.target === edges[edgeIdx].target
			);
			if (isBluePart) {
				edges[edgeIdx]["k_blue"] = true;
				vertices[edges[edgeIdx].source]["k_blue"] = true;
				vertices[edges[edgeIdx].target]["k_blue"] = true;
			}
			if (isRedPart) {
				edges[edgeIdx]["k_red"] = true;
				vertices[edges[edgeIdx].source]["k_red"] = true;
				vertices[edges[edgeIdx].target]["k_red"] = true;
			}
		}

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
			.selectAll("line")
			.data(edges)
			.enter()
			.append("line")
			.attr(
				"class",
				(d) =>
					`edge ${d.k_red ? "highlight-k-red" : ""} ${
						d.k_blue ? "highlight-k-blue" : ""
					}`
			)
			.attr("stroke", (d) => d.color);

		const node = svg
			.append("g")
			.selectAll("circle")
			.data(vertices)
			.enter()
			.append("circle")
			.attr("r", vertexRadius)
			.attr("class", "vertex")
			.attr("fill", (d) => {
				if (d.k_blue && d.k_red) {
					return "purple";
				} else if (d.k_blue) {
					return "blue";
				} else if (d.k_red) {
					return "red";
				} else {
					return "#ccc";
				}
			})
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
			link.attr("x1", (d) => (d.source as unknown as Vertex).x)
				.attr("y1", (d) => (d.source as unknown as Vertex).y)
				.attr("x2", (d) => (d.target as unknown as Vertex).x)
				.attr("y2", (d) => (d.target as unknown as Vertex).y);

			node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
		}

		return () => {
			simulation.stop();
		};
	}, [ramseyType, graphId]);

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
