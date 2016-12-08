import { RangeHandler } from "../Bases/RangeHandler"

import { Sensor } from "./Sensor"
import { Target } from "./Target"

export class Fixed extends RangeHandler {
	reset() {
		this.delegate.range = this.delegate.maxRange
	}

	coverCharges() {
		if (this.delegate.charges.length > 0) {
			this.delegate.range = this.delegate.maxRange
		} else {
			this.delegate.range = 0
		}
	}

	rangeToCover(target: Target) {
		return this.delegate.maxRange
	}
}
