import { Sensor } from "../Classes/Sensor"
import { Target } from "../Classes/Target"

export abstract class RangeHandler {
	delegate: Sensor

	constructor(delegate: Sensor) {
		this.delegate = delegate
	}

	abstract reset(): void
	abstract coverCharges(): void
	abstract rangeToCover(target: Target): number
}

export interface RangeHandlerStatic {
	new (delegate: Sensor): RangeHandler
}
