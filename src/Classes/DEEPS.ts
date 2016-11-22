import { Sensor } from "../Bases/Sensor"
import { Target } from "../Bases/Target"
import { log } from "../main"
import { Map } from "./Map"

export class DEEPS extends Sensor {
	coverers = new Map<Sensor, Target[]>()

	charges: Target[] = []
	filtered: Target[] = []

	sink: Target
	hill: Target

  targetLife: Number


/* calculate the battery life of targets */

	targetBattery(){
		for (const target of this.targets ){
			target.battery +=this.battery;
			this.targetLife = target.battery
		}
		return this.targetLife
	}

	preshuffle() {
		super.preshuffle()

		this.charges.length = 0
		this.filtered.length = 0
		this.coverers.empty()

		this.range = this.maxRange
	}

  shuffle() {
		if (this.battery === 0) {
			this.range = 0
			this.kill()

			return
		}

		/*if a target is covered by only one sensor then this is a sink*/

		let poorest=false


		if (this.targets.some((target) => target.sensors.length === 1)) {
			poorest = true;
		}

		/* if not we should look at the all sensors and their targets and find the target with the min battery life*/
		else {
			for (const sensor of this.sensors){
				const poorest = sensor.targets.every((target) => {
					return this === target ||
						this.targetLife < target.battery ||
						this.targetLife === target.battery && this.id < target.id
				})
				if(poorest){
					this.sink = target
				}
				else{
					this.hill=target
				}
			}
		}


}



  postshuffle() {
		super.postshuffle()

		this.communicate(this)
	}

  receiveCommunication(packet: DEEPS) {

  }
}
