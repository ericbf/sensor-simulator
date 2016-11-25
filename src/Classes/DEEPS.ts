import { Sensor } from "../Bases/Sensor"
import { Target } from "../Bases/Target"
import { log } from "../main"
import { Map } from "./Map"
import "../Bases/Function"

export class DEEPS extends Sensor {
	sink: Target | undefined

	static needsMemoizing = true

	/* calculate the battery life of targets */
	private static targetLife: (target: Target) => number

	private static refreshTargetLife() {
		if (DEEPS.needsMemoizing) {
			DEEPS.needsMemoizing = false

			DEEPS.targetLife = ((target: Target) =>
				target.sensors.reduce((trans, sensor) =>
					trans + sensor.battery / sensor.range, 0)).memoize()
		}
	}

	shuffle() {
		super.shuffle()

		if (this.battery === 0) {
			this.range = 0
			this.kill()

			return
		}

		// Rememoize this function to catch any changes since the last
		//   iteration, but save time for this current iteration.
		DEEPS.refreshTargetLife()

		this.shuffleSteps.push(() => {
			let on = false

			if (this.targets.some((target) => target.sensors.length === 1)) {
				log(`A target is coverers by only me, ${this.id}.`)

				this.final = true
			} else {
				// Determine the current sink for this target
				this.sink = this.targets.reduce((heretofore, target) =>
					DEEPS.targetLife(heretofore) > DEEPS.targetLife(target) ||
					DEEPS.targetLife(heretofore) === DEEPS.targetLife(target) && heretofore.id > target.id ?
						heretofore :
						target,
					this.targets[0])
			}
		}, () => {
			if (!this.sink || this.final) {
				return
			}

			const thoseForWhomSinkIsSink = this.sink.sensors.filter((sensor: DEEPS) => this.sink === sensor.sink)

			if (thoseForWhomSinkIsSink.every((sensor: DEEPS) =>
				this.battery > sensor.battery ||
				this.battery === sensor.battery && this.id >= sensor.id
			)) {
				this.charges.push(this.sink)
			}

			const hills = this.targets.filter((target) =>
				target.sensors.every((sensor: DEEPS) =>
					target !== sensor.sink))

			for (const hill of hills) {
				const inCharge = hill.sensors.reduce((heretofore: DEEPS, sensor: DEEPS) => {
					if (!heretofore.sink || !sensor.sink) {
						throw new Error("Sink cannot be undefined here")
					}

					if (heretofore.sink === sensor.sink) {
						return heretofore.battery > sensor.battery ||
							heretofore.battery === sensor.battery && heretofore.id > sensor.id ?
								heretofore :
								sensor
					}

					return DEEPS.targetLife(heretofore.sink) > DEEPS.targetLife(sensor.sink) ||
						DEEPS.targetLife(heretofore.sink) === DEEPS.targetLife(sensor.sink) && heretofore.sink.id > sensor.sink.id ?
							heretofore :
							sensor
				}, hill.sensors[0])

				if (this === inCharge) {
					this.charges.push(hill)
				}
			}

			if (this.charges.length === 0) {
				this.range = 0

				log(`I, ${this.id}, turned off (no charges).`)
			} else {
				log(`I, ${this.id}, stayed on with ${this.charges.length} charges.`)
			}
		}, () => {
			this.communicate(this)

			DEEPS.needsMemoizing = true
		})
	}
}
