import { Sensor } from "../Classes/Sensor"

export interface ChargeHandler {
	pushSteps(sensor: Sensor): void
}
