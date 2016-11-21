import { Sensor } from "../Bases/Sensor"
import { Target } from "../Bases/Target"
import { log } from "../main"

export class LoadBalancing extends Sensor {
	charge: Target[] = []
	packets: Sensor[] = []

	preshuffle() {
		super.preshuffle()

		this.charge.length = 0
		this.packets.length = 0

		this.range = this.maxRange
		this.final = false
	}

	shuffle() {
		if (this.battery === 0) {
			this.range = 0
			this.kill()

			return
		}

		let on = false

		if (this.targets.some((target) => target.sensors.length === 1)) {
			on = true

			log(`A target is covered by only me: ${this.id}`)

			this.final = true
		} else {
			for (const target of this.targets) {
				const richest = target.sensors.every((sensor) => {
					return this === sensor ||
						this.battery > sensor.battery ||
						this.battery === sensor.battery && this.id > sensor.id
				})

				if (richest) {
					this.charge.push(target)
				}
			}

			// We are either awake or not at this point, based on whether we are
			//   in charge of any targets, and whether our neighbors are awake
			//   or not.
			on = this.charge.length > 0
		}

		if (on) {
			log(`I, ${this.id}, stayed on with ${this.charge.length} charges`)
		}

		this.range = on ? this.maxRange : 0
	}

	postshuffle() {
		super.postshuffle()

		this.communicate(this)
	}

	receiveCommunication(packet: LoadBalancing) {
		if (this.range > 0 && packet.range > 0 && !this.final) {
			log(`${packet} communicated to ${this}`)

			this.charge = this.charge.filter((target) => {
				const include = packet.targets.indexOf(target) < 0

				if (!include) {
					packet.charge.push(target)
				}

				return include
			})

			if (this.charge.length === 0) {
				this.range = 0

				log("I turned off after the fact:", this.id)
			}
		}
	}
}
