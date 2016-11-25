import { Sensor } from "../Bases/Sensor"
import { Target } from "../Bases/Target"
import { log } from "../main"
import { Map } from "./Map"

export class LoadBalancing extends Sensor {
	coverers = new Map<Sensor, Target[]>()

	charges: Target[] = []

	shuffle() {
		super.shuffle()

		if (this.battery === 0) {
			this.range = 0
			this.kill()

			return
		}

		this.shuffleSteps.push(() => {
			// Mid shuffle
			let on = false

			if (this.targets.some((target) => target.sensors.length === 1)) {
				on = true

				log(`A target is coverers by only me: ${this.id}`)

				this.final = true
			} else {
				for (const target of this.targets) {
					const richest = target.sensors.every((sensor) => {
						return this === sensor ||
						this.battery > sensor.battery ||
						this.battery === sensor.battery && this.id > sensor.id
					})

					if (richest) {
						this.charges.push(target)
					}
				}

				// We are either awake or not at this point, based on whether we are
				//   in charges of any targets, and whether our neighbors are awake
				//   or not.
				on = this.charges.length > 0
			}

			if (on) {
				log(`I, ${this.id}, stayed on with ${this.charges.length} charges`)
			}

			this.range = on ? this.maxRange : 0
		}, () => {
			// Post shuffle
			this.communicate(this)
		})
	}
}
