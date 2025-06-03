"use client";

import { Container, InputGroup, Form, Row, Col } from "react-bootstrap";
import InputGroupText from "react-bootstrap/esm/InputGroupText";
import { ChangeEvent, useMemo, useState } from "react";

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

export default function Main() {
	const width = 700,
		height = 700,
		radius = 270,
		vertexRadius = 20;

	const vertsLookup = {
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

	const [ramseyType, setRamseyType] = useState<RamseyType>("r34");
	const [graphId, setGraphId] = useState(1);

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

	useMemo(() => {
		console.log(`ramsey changed to ${ramseyType}`);
	}, [ramseyType]);

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
				<svg id="graphSvg" width="700" height="700"></svg>
			</div>
		</Container>
	);
}
