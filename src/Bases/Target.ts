import { Positionable } from "./Positionable"
import { Sensor } from "./Sensor"

export class Target extends Positionable {
	sensors: Sensor[] = []
}
