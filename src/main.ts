import readline = require("readline")
import { Sensor } from "./Classes/Sensor"
import { Target } from "./Classes/Target"

class AlwaysOn extends Sensor {
	shuffle() { this.shuffling = false }
	receiveCommunication() {}
}

const width = 100,
	sensorCount = 1000,
	targetCount = 1000,
	maxRange = 20

function pos() {
	return Math.floor(Math.random() * (width + 1))
}

function battery() {
	return Math.random() * pow(maxRange) + pow(maxRange)
}

const sensors: Sensor[] = [],
	targets: Target[] = []

for (let i = 0; i < sensorCount; i++) {
	sensors.push(new AlwaysOn(pos(), pos(), battery(), maxRange))
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

function pow(range: number) {
	return range * range
}

let life = 0

while (true) {
	for (const sensor of sensors) {
		if (!sensor.shuffling) {
			sensor.shuffling = true
			sensor.shuffle()
		}
	}

	if (sensors.some((sensor) => sensor.shuffling)) {
		console.log("still shuffling")
	}

	let weak = sensors[0]

	for (const sensor of sensors) {
		// Padding for JS roundoff error
		if (sensor.battery - 10e-3 <= 0) {
			for (const target of sensor.targets) {
				target.sensors.splice(target.sensors.indexOf(sensor), 1)
			}

			continue
		}

		if (weak.battery / pow(weak.range) > sensor.battery / pow(sensor.range)) {
			weak = sensor
		}
	}

	// If any target is uncovered, break out now
	if (targets.some((target) => target.sensors.length === 0)) {
		break
	}

	const iteration = Math.min(1, weak.battery / pow(weak.range))

	// console.log("iteration:", iteration)

	for (const sensor of sensors) {
		sensor.battery -= pow(sensor.range) * iteration
	}

	life += iteration
}

console.log("life:", life)
