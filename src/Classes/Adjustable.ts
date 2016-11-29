import { RangeHandler } from "../Bases/RangeHandler"

import { Sensor } from "./Sensor"
import { Target } from "./Target"

export class Adjustable extends RangeHandler {
	private rangeSensor(toTarget: Target | undefined) {
		if (toTarget) {
			this.delegate.range = this.delegate.rangeTo(toTarget)
		} else {
			this.delegate.range = 0
		}
	}

	reset() {
		this.rangeSensor(this.delegate.targets[this.delegate.targets.length - 1])
	}

	coverCharges() {
		this.rangeSensor(this.delegate.charges[this.delegate.charges.length - 1])
	}

	rangeToCover(target: Target) {
		return this.delegate.rangeTo(target)
	}
}
