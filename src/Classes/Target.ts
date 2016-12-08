import { Positionable } from "../Bases/Positionable"

import { Sensor } from "./Sensor"

export class Target extends Positionable {
	sensors: Sensor[] = []
}
