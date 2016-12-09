import { RangeHandler } from "../Bases/RangeHandler"

import { Sensor } from "./Sensor"
import { Target } from "./Target"

export class Adjustable extends RangeHandler {
	private cover(targets: Target[]) {
		const toTarget = targets.reduce((trans, current) => {
			return this.delegate.rangeTo(trans) > this.delegate.rangeTo(current) ?
				trans :
				current
		}, targets[0])

		if (toTarget) {
			this.delegate.range = this.delegate.rangeTo(toTarget)
		} else {
			this.delegate.range = 0
		}
	}

	reset() {
		this.cover(this.delegate.targets)
	}

	coverCharges() {
		this.cover(this.delegate.charges)
	}

	rangeToCover(target: Target) {
		return this.delegate.rangeTo(target)
	}
}
