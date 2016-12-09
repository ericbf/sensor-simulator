import "../Bases/Function"

import { Sensor } from "./Sensor"
import { Target } from "./Target"
import { Map } from "./Map"

export module DEEPS {
	interface DEEPSSensor extends Sensor {
		// The sink!
		storage: Target
	}

	let needsMemoizing = true

	// calculate the battery life of targets
	let targetLife: (target: Target) => number
	let isHill: (target: Target) => boolean

	function refreshFunctions() {
		if (needsMemoizing) {
			needsMemoizing = false

			targetLife = ((target: Target) => {
				const r = target.sensors.reduce((trans, sensor) =>
					trans + richness(sensor, target), 0)

				return r
			}).memoize()

			isHill = ((target: Target) =>
				target.sensors.every((sensor: DEEPSSensor) =>
					target !== sensor.storage)).memoize()
		}
	}

	function richness(sensor: Sensor, target: Target) {
		return sensor.battery / sensor.rangeHandler.rangeToCover(target)
	}

	export function pushSteps(sensor: DEEPSSensor) {
		sensor.shuffleSteps.push(() => {
			needsMemoizing = true
		}, () => {
			// Rememoize sensor function to catch any changes since the last
			//   iteration, but save time for sensor current iteration.
			refreshFunctions()

			// Let sink be a target t which is poorest for at least one sensor
			//   covering t.
			sensor.storage = sensor.targets.reduce((heretofore, current) =>
				targetLife(heretofore) < targetLife(current) ||
				targetLife(heretofore) === targetLife(current) && heretofore.id < current.id ?
					heretofore :
					current)
		}, () => {
			// If target t is a sink, then the richest among sensors for which t
			//   is the poorest is placed in charge of t.
			const thoseWithSameSink = sensor.storage.sensors.filter((other: DEEPSSensor) => sensor.storage === other.storage)

			if (thoseWithSameSink.every((other: DEEPSSensor) =>
				sensor === other ||
				richness(sensor, sensor.storage) > richness(other, other.storage) ||
				richness(sensor, sensor.storage) === richness(other, other.storage) && sensor.id > other.id
			)) {
				sensor.charges.push(sensor.storage)
			}

			// hill, i.e., a target which is not the poorest for any of covering
			//   sensors
			const hills = sensor.targets.filter(isHill)

			for (const hill of hills) {
				// If target t is a hill then the sensor s covering t whose
				//   poorest target is the richest over all sensors covering t,
				//   is placed in charge of t. If there are several such
				//   sensors, i.e., several sensors with the same poorest
				//   target, then the richest among them is placed in charge of
				//   t.
				const inCharge = hill.sensors.every((other: DEEPSSensor) => {
					if (sensor === other) {
						return true
					}

					if (sensor.storage === other.storage) {
						return richness(sensor, sensor.storage) > richness(other, other.storage) ||
							richness(sensor, sensor.storage) === richness(other, other.storage) && sensor.id > other.id
					}

					return targetLife(sensor.storage) > targetLife(other.storage) ||
						targetLife(sensor.storage) === targetLife(other.storage) && sensor.storage.id > other.storage.id
				})

				if (inCharge) {
					sensor.charges.push(hill)
				}
			}

			// We are either awake or not, based on whether we are in charges of
			//   any targets.
			sensor.rangeHandler.coverCharges()
		})
	}
}
