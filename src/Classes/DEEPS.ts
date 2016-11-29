import "../Bases/Function"

import { log } from "../main"

import { Sensor } from "./Sensor"
import { Target } from "./Target"
import { Map } from "./Map"

export module DEEPS {
	interface DEEPSSensor extends Sensor {
		sink: Target
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

			sensor.sink = sensor.targets.reduce((heretofore, current) =>
				targetLife(heretofore) < targetLife(current) ||
				targetLife(heretofore) === targetLife(current) && heretofore.id < current.id ?
					heretofore :
					current,
				sensor.targets[0])
		}, () => {
			const thoseForWhomSinkIsSink = sensor.sink.sensors.filter((other: DEEPSSensor) => sensor.sink === other.sink)

			if (thoseForWhomSinkIsSink.every((other) =>
				sensor === other ||
				sensor.battery / sensor.rangeHandler.rangeToCover(sensor.sink) > other.battery / other.rangeHandler.rangeToCover(sensor.sink) ||
				sensor.battery / sensor.rangeHandler.rangeToCover(sensor.sink) === other.battery / other.rangeHandler.rangeToCover(sensor.sink) && sensor.id > other.id
			)) {
				sensor.charges.push(sensor.sink)
			}

			const hills = sensor.targets.filter((target) =>
				target.sensors.every((other: DEEPSSensor) =>
					target !== other.sink))

			for (const hill of hills) {
				const inCharge = hill.sensors.reduce((heretofore: DEEPSSensor, current: DEEPSSensor) => {
					if (heretofore.sink === current.sink) {
						return heretofore.battery / heretofore.rangeHandler.rangeToCover(heretofore.sink) > current.battery / current.rangeHandler.rangeToCover(current.sink) ||
							heretofore.battery / heretofore.rangeHandler.rangeToCover(heretofore.sink) === current.battery / current.rangeHandler.rangeToCover(current.sink) && heretofore.id > current.id ?
								heretofore :
								current
					}

					return targetLife(heretofore.sink) > targetLife(current.sink) ||
						targetLife(heretofore.sink) === targetLife(current.sink) && heretofore.sink.id > current.sink.id ?
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
