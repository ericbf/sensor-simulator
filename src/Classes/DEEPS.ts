import "../Bases/Function"

import { log } from "../main"

import { Sensor } from "./Sensor"
import { Target } from "./Target"
import { Map } from "./Map"

export module DEEPS {
	interface DEEPSSensor extends Sensor {
		storage: {
			sink: Target
		}
	}

	let needsMemoizing = true

	/* calculate the battery life of targets */
	let targetLife: (target: Target) => number

	function refreshTargetLife() {
		if (needsMemoizing) {
			needsMemoizing = false

			targetLife = ((target: Target) =>
				target.sensors.reduce((trans, sensor) =>
					trans + sensor.battery / sensor.rangeHandler.rangeToCover(target), 0)).memoize()
		}
	}

	export function pushSteps(sensor: DEEPSSensor) {
		sensor.shuffleSteps.push(() => {
			needsMemoizing = true
		}, () => {
			// Rememoize sensor function to catch any changes since the last
			//   iteration, but save time for sensor current iteration.
			refreshTargetLife()

			sensor.storage.sink = sensor.targets.reduce((heretofore, current) =>
				targetLife(heretofore) < targetLife(current) ||
				targetLife(heretofore) === targetLife(current) && heretofore.id < current.id ?
					heretofore :
					current,
				sensor.targets[0])
		}, () => {
			const thoseForWhomSinkIsSink = sensor.storage.sink.sensors.filter((other: DEEPSSensor) => sensor.storage.sink === other.storage.sink)

			if (thoseForWhomSinkIsSink.every((other) =>
				sensor === other ||
				sensor.battery / sensor.rangeHandler.rangeToCover(sensor.storage.sink) > other.battery / other.rangeHandler.rangeToCover(sensor.storage.sink) ||
				sensor.battery / sensor.rangeHandler.rangeToCover(sensor.storage.sink) === other.battery / other.rangeHandler.rangeToCover(sensor.storage.sink) && sensor.id > other.id
			)) {
				sensor.charges.push(sensor.storage.sink)
			}

			const hills = sensor.targets.filter((target) =>
				target.sensors.every((other: DEEPSSensor) =>
					target !== other.storage.sink))

			for (const hill of hills) {
				const inCharge = hill.sensors.reduce((heretofore: DEEPSSensor, current: DEEPSSensor) => {
					if (heretofore.storage.sink === current.storage.sink) {
						return heretofore.battery / heretofore.rangeHandler.rangeToCover(heretofore.storage.sink) > current.battery / current.rangeHandler.rangeToCover(current.storage.sink) ||
							heretofore.battery / heretofore.rangeHandler.rangeToCover(heretofore.storage.sink) === current.battery / current.rangeHandler.rangeToCover(current.storage.sink) && heretofore.id > current.id ?
								heretofore :
								current
					}

					return targetLife(heretofore.storage.sink) > targetLife(current.storage.sink) ||
						targetLife(heretofore.storage.sink) === targetLife(current.storage.sink) && heretofore.storage.sink.id > current.storage.sink.id ?
							heretofore :
							current
				}, hill.sensors[0])

				if (sensor === inCharge) {
					sensor.charges.push(hill)
				}
			}

			sensor.rangeHandler.coverCharges()
		})
	}
}
