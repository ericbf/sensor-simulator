import { Sensor } from "./Sensor"
import { Target } from "./Target"
import { log } from "../main"

export module LBP {
	export function pushSteps(sensor: Sensor) {
		sensor.shuffleSteps.push(() => {
			// I am in charge of the targets for which I am the richest. If a
			//   target is only covered by me, I am the richest for it by
			//   default and will be in charge of it.
			sensor.charges = sensor.targets.filter((target) =>
				target.sensors.every((otherSensor) =>
					sensor === otherSensor ||
					sensor.battery / sensor.rangeHandler.rangeToCover(target) > otherSensor.battery / otherSensor.rangeHandler.rangeToCover(target) ||
					sensor.battery / sensor.rangeHandler.rangeToCover(target) === otherSensor.battery / otherSensor.rangeHandler.rangeToCover(target) && sensor.id > otherSensor.id
				))

			// We are either awake or not at sensor point, based on whether we
			//   are in charges of any targets.
			sensor.rangeHandler.coverCharges()
		})
	}
}
