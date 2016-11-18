import { Sensor } from "../Bases/Sensor"
import { Target } from "../Bases/Target"

export class LoadBalancing extends Sensor {
	charge: Target[]

	private filterCharge(sensor: Sensor) {
		this.charge = this.charge.filter((target) => sensor.targets.indexOf(target) < 0)
	}

	preshuffle() {
		super.preshuffle()

		this.charge = this.targets
	}

	shuffle() {
		if (!this.shuffling) {
			return
		}

		let on = false

		if (this.charge.some((target) => target.sensors.length === 1)) {
			on = true
		} else {
			for (const sensor of this.sensors) {
				if (sensor.battery > this.battery ||
					sensor.battery === this.battery && sensor.id > this.id ||
					!sensor.shuffling && sensor.range) {
					// Other sensor is stronger, or sensor is set to on. We can
					//   release charge of the targets it covers.
					this.filterCharge(sensor)
				}
			}

			// We are either awake or not at this point, based on whether we are
			//   in charge of any targets, and whether our neighbors are awake
			//   or not.
			on = this.charge.length > 0
		}

		this.shuffling = false
		this.range = on ? this.maxRange : 0

		this.communicate({
			self: this,
			state: on
		})
	}

	receiveCommunication(packet: any) {
		if (packet.state) {
			this.filterCharge(packet.self)

			if (this.charge.length === 0) {
				this.range = 0

				this.shuffling = false
			}
		}
	}
}
