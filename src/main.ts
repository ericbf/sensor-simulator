import readline = require("readline")
import { Sensor } from "./Bases/Sensor"
import { Target } from "./Bases/Target"

import { LoadBalancing } from "./Classes/LoadBalancing"
import { AlwaysOn } from "./Classes/AlwaysOn"

const debug = false

export function log(...params: any[]) {
	if (debug) {
		console.log.apply(console, arguments)
	}
}

const maxDistance = 5,
	maxRange = Math.pow(maxDistance, 2),
	targets: Target[] = []

let sensors: Sensor[] = []

// targets.push(
// 	new Target(0, 2),
// 	new Target(0, -2)
// )
// sensors.push(
// 	new LoadBalancing(-3, 0, 50, maxRange),
// 	new LoadBalancing(3, 0, 50, maxRange),
// 	new LoadBalancing(0, 3, 50, maxRange),
// 	new LoadBalancing(0, -3, 50, maxRange)
// )

const width = 10,
	sensorCount = 100,
	targetCount = 10

function pos() {
	return Math.floor(Math.random() * (width + 1))
}

function battery() {
	return Math.random() * maxRange + 5 * maxRange
}

for (let i = 0; i < sensorCount; i++) {
	sensors.push(new LoadBalancing(pos(), pos(), battery(), maxRange))
}

for (let i = 0; i < targetCount; i++) {
	targets.push(new Target(pos(), pos()))
}

const xSensors = sensors.sort((lhs, rhs) => lhs.x - rhs.x),
	xTargets = targets.sort((lhs, rhs) => lhs.x - rhs.x)

log("will assign coverages")

let upper = 0,
	lower = 0

for (const sensor of xSensors) {
	// Fix the lower bound of targets to consider
	while (xTargets[lower] && sensor.x - xTargets[lower].x > maxDistance) {
		lower++
	}

	// Fix the upper bound of targets to consider
	while (xTargets[upper] && sensor.x - xTargets[upper].x >= -maxDistance) {
		upper++
	}

	sensor.targets = xTargets.slice(lower, upper).filter((target) => target.distanceTo(sensor) <= maxDistance)

	for (const target of sensor.targets) {
		target.sensors.push(sensor)
	}
}

upper = 0
lower = 0

for (const sensor of xSensors) {
	// Fix the lower bound of targets to consider
	while (xSensors[lower] && sensor.x - xSensors[lower].x > maxDistance * 2) {
		lower++
	}

	// Fix the upper bound of targets to consider
	while (xSensors[upper] && sensor.x - xSensors[upper].x >= -maxDistance * 2) {
		upper++
	}

	sensor.sensors = xSensors.slice(lower, upper).filter((otherSensor) => otherSensor !== sensor && otherSensor.distanceTo(sensor) <= maxDistance * 2)
}

log("assigned coverages")

let life = 0

while (true) {
	sensors.forEach((sensor) => sensor.preshuffle())
	sensors.forEach((sensor) => sensor.shuffle())
	sensors.forEach((sensor) => sensor.postshuffle())

	let weak: Sensor = undefined as any

	sensors = sensors.filter((sensor) => {
		// Padding for JS roundoff error
		if (sensor.battery === 0) {
			sensor.kill()

			log("died:", sensor.id, sensor.battery)

			return false
		}

		if (!weak || weak.battery / weak.range > sensor.battery / sensor.range) {
			weak = sensor
		}

		return true
	})

	const dead = targets.some((target) => {
		const noCoverage = target.sensors.length === 0,
			allOff = !target.sensors.some((sensor) => {
				return sensor.range > 0
			})

		if (noCoverage) {
			log("No coverage!!")
		} else if (allOff) {
			log(`All off!! One of [${target.sensors.sort((l, r) => parseInt(l.id) - parseInt(r.id))}] should have stayed on...`)
		}

		return noCoverage || allOff
	})

	// If any target is uncovered after killing dead sensors, break out here
	if (dead) {
		log("dying!")

		break
	}

	const iteration = Math.min(1, weak.battery / weak.range)

	log("iteration:", iteration)

	for (const sensor of sensors) {
		if (sensor.range) {
			log(`on - ${sensor.id}: ${sensor.battery} -> ${sensor.battery - sensor.range * iteration}`)
		} else {
			log(`off - ${sensor.id}: ${sensor.battery} -> ${sensor.battery - sensor.range * iteration}`)
		}

		sensor.battery -= sensor.range * iteration

		if (sensor.battery <= 10e-3) {
			sensor.battery = 0
		}
	}

	life += iteration
}

console.log("life:", life)
