import { Sensor } from "../Classes/Sensor"

export interface Protocol {
	pushSteps(sensor: Sensor): void
}
