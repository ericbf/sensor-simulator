import { Positionable } from "./Positionable"
import { Target } from "./Target"
import { Map } from "../Classes/Map"
import { log } from "../main"

export abstract class Sensor extends Positionable {
	sensors: Sensor[] = []
	targets: Target[] = []

	maxRange: number
	range: number
	battery: number

	/**
	 * This function should be overriden depending on the implementation. It
	 *   should load some shuffle steps after calling the `super.shuffle()`.
	 */
	shuffle() {
		this.shuffleSteps.length = 0

		this.shuffleSteps.push(() => {
			// Pre shuffle
			this.charges.length = 0
			this.coverers.empty()

			this.range = this.maxRange
		})
	}

	shuffleSteps: (() => void)[] = []

	/**
	 * Whether this sensor is currently shuffling, or it has settled into its
	 *   range for the next iteration cycle.
	 */
	final = false

	coverers = new Map<Sensor, Target[]>()
	charges: Target[] = []

	/**
	 * This is where this sensor receives communications from other sensors.
	 *   This is what you will call on all other sensors in reshuffle, and here
	 *   you'll implement the logic for each protocol.
	 *
	 * @param params - the parameters that were broadcasted.
	 */
	 receiveCommunication(packet: Sensor) {
		 if (this.final) {
			 return
		 }

		 if (packet.range > 0 && this.range > 0) {
			 log(`${packet} communicated it was on to ${this}`)

			 this.charges = this.charges.filter((target) => {
				 const include = packet.targets.indexOf(target) < 0

				 if (!include) {
					 this.coverers.getOrPut(packet, []).push(target)
				 }

				 return include
			 })

			 if (this.charges.length === 0) {
				 this.range = 0

				 log("I turned off after the fact:", this.id)

				 this.communicate(this)
			 }
		 } else if (packet.range === 0) {
			 const targets = this.coverers.get(packet)

			 if (targets) {
				 log(`${packet} communicated it was off to ${this}`)

				 this.charges.push.apply(this.charges, targets.filter((target) => this.charges.indexOf(target) < 0))
			 }

			 if (this.charges.length > 0 && this.range === 0) {
				 this.range = this.maxRange

				 log("I turned back on:", this.id)

				 this.communicate(this)
			 }
		 }
	 }

	/**
	 * Use this to store any data needed during the execution of the protocol.
	 */
	storage: any

	constructor(x: number, y: number, battery: number, maxRange: number) {
		super(x, y)

		this.battery = battery
		this.range = this.maxRange = maxRange
	}

	communicate(...params: any[]) {
		for (const sensor of this.sensors) {
			sensor.receiveCommunication.apply(sensor, params)
		}
	}

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
		return `[${this.id}: ${this.battery}]`
	}
}
