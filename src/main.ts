import readline = require("readline")
import { Sensor } from "./Bases/Sensor"
import { Target } from "./Bases/Target"

import { LoadBalancing } from "./Classes/LoadBalancing"
import { AlwaysOn } from "./Classes/AlwaysOn"

const width = 100,
	sensorCount = 100,
	targetCount = 100,
	maxRange = 30

function pos() {
	return Math.floor(Math.random() * (width + 1))
}

function battery() {
	return Math.random() * pow(maxRange) + 10 * pow(maxRange)
}

const targets: Target[] = []

let sensors: Sensor[] = []

for (let i = 0; i < sensorCount; i++) {
	sensors.push(new LoadBalancing(pos(), pos(), battery(), maxRange))
}

for (let i = 0; i < targetCount; i++) {
	targets.push(new Target(pos(), pos()))
}

const xSensors = sensors.sort((lhs, rhs) => lhs.x - rhs.x),
	xTargets = targets.sort((lhs, rhs) => lhs.x - rhs.x)

let upper = 0,
	lower = 0

for (const sensor of xSensors) {
	// Fix the lower bound of targets to consider
	while (xTargets[lower] && sensor.x - xTargets[lower].x < -maxRange) {
		lower++
	}

	// Fix the upper bound of targets to consider
	while (xTargets[upper] && sensor.x - xTargets[upper].x < maxRange) {
		upper++
	}

	sensor.targets = xTargets.slice(lower, upper).filter((target) => target.distanceTo(sensor) <= maxRange)

	for (const target of sensor.targets) {
		target.sensors.push(sensor)
	}
}

upper = 0
lower = 0

for (const sensor of xSensors) {
	// Fix the lower bound of targets to consider
	while (xSensors[lower] && sensor.x - xSensors[lower].x < -maxRange) {
		lower++
	}

	// Fix the upper bound of targets to consider
	while (xSensors[upper] && sensor.x - xSensors[upper].x < maxRange) {
		upper++
	}

	sensor.sensors = xSensors.slice(lower, upper).filter((otherSensor) => otherSensor.distanceTo(sensor) <= maxRange)
}

function pow(range: number) {
	return range * range
}

let life = 0

while (true) {
	sensors.forEach((sensor) => sensor.preshuffle())
	sensors.forEach((sensor) => sensor.shuffle())

	let weak: Sensor = undefined as any

	sensors = sensors.filter((sensor) => {
		// Padding for JS roundoff error
		if (sensor.battery - 10e-3 <= 0) {
			sensor.kill()

			// console.log("died:", sensor.id, sensor.battery)

			return false
		}

		if (!weak || weak.battery / pow(weak.range) > sensor.battery / pow(sensor.range)) {
			weak = sensor
		}

		return true
	})

	// If any target is uncovered, break out here, after killing dead sensors
	if (targets.some((target) => target.sensors.length === 0)) {
		// console.log("dying!")

		break
	}

	const iteration = Math.min(1, weak.battery / pow(weak.range))

	// console.log("iteration:", iteration)

	for (const sensor of sensors) {
		// if (sensor.range) {
		// 	console.log(`${sensor.id}: ${sensor.battery} - ${pow(sensor.range) * iteration}`)
		// }

		sensor.battery -= pow(sensor.range) * iteration
	}

	life += iteration
}

console.log("life:", life)
