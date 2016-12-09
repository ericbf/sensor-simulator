import { ChargeHandler } from "../Bases/ChargeHandler"
import { RangeHandler } from "../Bases/RangeHandler"
import { RangeHandlerStatic } from "../Bases/RangeHandler"
import { Positionable } from "../Bases/Positionable"

import { Target } from "./Target"
import { Map } from "../Classes/Map"

export class Sensor extends Positionable {
	sensors: Sensor[] = []
	targets: Target[] = []

	range = 0

	maxRange: number
	battery: number

	protocol: ChargeHandler
	rangeHandler: RangeHandler

	shuffleSteps = [] as (() => void)[]
	charges = [] as Target[]
	unfilteredCharges = [] as Target[]

	coverers = new Map<Target, {[id: string]: Sensor}>()

	constructor(protocol: ChargeHandler, rangeHandlerConstructor: RangeHandlerStatic, maxRange: number, x: number, y: number, battery: number) {
		super(x, y)

		this.protocol = protocol
		this.rangeHandler = new rangeHandlerConstructor(this)

		this.battery = battery
		this.maxRange = maxRange
	}

	prepare() {
		this.coverers.empty()

		this.rangeHandler.reset()
	}

	/**
	 * This function should be overriden depending on the implementation. It
	 *   should load some shuffle steps after calling the `super.shuffle()`.
	 */
	shuffle() {
		if (this.battery === 0 || this.targets.length === 0) {
			this.range = 0
			this.kill()

			return
		}

		this.charges.length = 0
		this.shuffleSteps.length = 0

		this.protocol.pushSteps(this)

		this.shuffleSteps.push(() => {
			this.unfilteredCharges = this.charges.slice(0)
		})

		this.broadcast()
	}

	/**
	 * This is where this sensor receives communications from other sensors.
	 *   This is what you will call on all other sensors in reshuffle, and here
	 *   you'll implement the logic for each protocol.
	 *
	 * @param sensor - the sensor that communicated itself.
	 */
	receiveCommunication(sensor: Sensor) {
		let changed = false

		for (const target of this.unfilteredCharges) {
			const coverers = this.coverers.getOrPut(target, {}),
				iCharge = this.charges.indexOf(target)

			if (sensor.rangeTo(target) <= sensor.range) {
				// Covered by the sensor who communicated
				coverers[sensor.id] = sensor

				if (iCharge >= 0) {
					// Remove this from my charges if I was in charge of it. He
					//   will take care of it for me.
					this.charges.splice(iCharge, 1)

					changed = true
				}
			} else {
				// NOT covered by the sensor who communicated
				delete coverers[sensor.id]

				if (Object.keys(coverers).length === 0 && iCharge < 0) {
					// Totally uncovered except by me. Add back to my charges!
					this.charges.push(target)

					changed = true
				}
			}
		}

		if (changed) {
			const oldRange = this.range

			this.rangeHandler.coverCharges()

			if (this.range !== oldRange) {
				this.broadcast()
			}
		}
	}

	/**
	 * Use this to store any data needed during the execution of the protocol.
	 */
	storage = {} as { [prop: string]: any }

	broadcast() {
		const index = this.shuffleSteps.indexOf(this.doBroadcast)

		if (index >= 0) {
			this.shuffleSteps.splice(index, 1)
		}

		this.shuffleSteps.push(this.doBroadcast)
	}

	private doBroadcast = (() => {
		for (const sensor of this.sensors) {
			sensor.receiveCommunication(this)
		}
	}).bind(this)

	/**
	 * Remove this sensor from the targets and sensors with whom it is
	 *   associated.
	 */
	kill() {
		for (const target of this.targets) {
			const index = target.sensors.indexOf(this)

			if (index >= 0) {
				target.sensors.splice(index, 1)
			}
		}

		for (const sensor of this.sensors) {
			const index = sensor.sensors.indexOf(this)

			if (index >= 0) {
				sensor.sensors.splice(index, 1)
			}
		}
	}

	toString() {
		return this.id
	}
}
