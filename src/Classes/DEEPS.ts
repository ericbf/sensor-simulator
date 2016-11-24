import { Sensor } from "../Bases/Sensor"
import { Target } from "../Bases/Target"
import { log } from "../main"
import { Map } from "./Map"
import "../Bases/Function"

export class DEEPS extends Sensor {
	coverers = new Map<Sensor, Target[]>()

	charges: Target[] = []

	sink: Target | undefined

	static needsPrepare = true

	/* calculate the battery life of targets */
	private static targetLife: (target: Target) => number

	private static refreshTargetLife() {
		if (DEEPS.needsPrepare) {
			DEEPS.needsPrepare = false

			DEEPS.targetLife = ((target: Target) => {
				return target.sensors.reduce((trans, sensor) => trans + sensor.battery / sensor.range, 0)
			}).memoize()
		}
	}

	shuffle() {
		super.shuffle()

		if (this.battery === 0) {
			this.range = 0
			this.kill()

			return
		}

		this.shuffleSteps.push(() => {
			this.charges.length = 0
			this.coverers.empty()

			this.range = this.maxRange

			// Rememoize this function to catch any changes since the last
			//   iteration, but save time for this current iteration.
			DEEPS.refreshTargetLife()
		}, () => {
			let on = false

			if (this.targets.some((target) => target.sensors.length === 1)) {
				log(`A target is coverers by only me, ${this.id}.`)

				this.final = true
			}

			// Determine the current sink for this target
			for (const target of this.targets) {
				if (!this.sink || DEEPS.targetLife(this.sink) > DEEPS.targetLife(target)) {
					this.sink = target
				}
			}
		}, () => {
			if (!this.sink || this.final) {
				return
			}

			if (this.sink.sensors.every((sensor: DEEPS) =>
				this === sensor ||
				this.battery > sensor.battery ||
				this.battery === sensor.battery && this.id > sensor.id
			)) {
				this.charges.push(this.sink)
			}

			let hills: Target[] = []

			for (const target of this.targets) {
				if (target.sensors.every((sensor: DEEPS) => target !== sensor.sink)) {
					hills.push(target)
				}
			}

			for (const target of hills) {
				const charge = target.sensors.every((sensor: DEEPS) => {
					if (!this.sink || !sensor.sink) {
						return false
					}

					if (this === sensor) {
						return true
					}

					if (this.sink === sensor.sink) {
						return this.battery > sensor.battery ||
							this.battery === sensor.battery && this.id > sensor.id
					}

					return DEEPS.targetLife(this.sink) > DEEPS.targetLife(sensor.sink) ||
						DEEPS.targetLife(this.sink) === DEEPS.targetLife(sensor.sink) && this.sink.id > sensor.sink.id
				})

				if (charge) {
					this.charges.push(target)
				}
			}

			if (this.charges.length === 0) {
				this.range = 0

				log(`I, ${this.id}, turned off with no charges.`)
			} else {
				log(`I, ${this.id}, stayed on with ${this.charges.length} charges.`)
			}
		}, () => {
			this.communicate(this)

			DEEPS.needsPrepare = true
		})
	}

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
}
