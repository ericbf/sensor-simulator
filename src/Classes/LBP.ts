import { Sensor } from "./Sensor"
import { Target } from "./Target"

export module LBP {
	function richness(sensor: Sensor, target: Target) {
		return sensor.battery / sensor.rangeHandler.rangeToCover(target)
	}

	export function pushSteps(sensor: Sensor) {
		sensor.shuffleSteps.push(() => {
			// I am in charge of the targets for which I am the richest. If a
			//   target is only covered by me, I am the richest for it by
			//   default and will be in charge of it.
			sensor.charges = sensor.targets.filter((target) =>
				target.sensors.every((other) =>
					sensor === other ||
					richness(sensor, target) > richness(other, target) ||
					richness(sensor, target) === richness(other, target) && sensor.id > other.id
				))

				// We are either awake or not, based on whether we are in charges of
				//   any targets.
			sensor.rangeHandler.coverCharges()
		})
	}
}
