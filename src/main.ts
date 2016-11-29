import readline = require("readline")

import { Protocol } from "./Bases/Protocol"
import { RangeHandlerStatic } from "./Bases/RangeHandler"

import { Sensor } from "./Classes/Sensor"
import { Target } from "./Classes/Target"

import { LBP } from "./Classes/LBP"
import { DEEPS } from "./Classes/DEEPS"

import { Fixed } from "./Classes/Fixed"
import { Adjustable } from "./Classes/Adjustable"

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

const width = 10,
	sensorCount = 50,
	targetCount = 10

const used = {} as { [x: number]: { [y: number]: boolean | undefined } | undefined }

function pos() {
	function rand() {
		return Math.floor(Math.random() * (width + 1))
	}

	let x = rand(),
		y = rand()

	while (used[x] != undefined && used[x]![y]) {
		x = rand()
		y = rand()
	}

	if (used[x] == undefined) {
		used[x] = {}
	}

	used[x]![y] = true

	return {
		x,
		y
	}
}

function battery() {
	return Math.random() * maxRange + 5 * maxRange
}

for (let i = 0; i < sensorCount; i++) {
	const p = pos()

	sensors.push(new Sensor(DEEPS, Adjustable, p.x, p.y, battery(), maxRange))
}

for (let i = 0; i < targetCount; i++) {
	const p = pos()

	targets.push(new Target(p.x, p.y))
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

	sensor.targets.sort((lhs, rhs) => sensor.distanceTo(lhs) - sensor.distanceTo(rhs))
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
	sensor.sensors.sort((lhs, rhs) => sensor.distanceTo(lhs) - sensor.distanceTo(rhs))
}

for (const target of targets) {
	target.sensors.sort((lhs, rhs) => target.distanceTo(lhs) - target.distanceTo(rhs))
}

log("assigned coverages")

let life = 0

iterate()

function iterate() {
	sensors.forEach((sensor) => sensor.prepare())
	sensors.forEach((sensor) => sensor.shuffle())

	runShift()

	function runShift() {
		let hadAny = false

		sensors.forEach((sensor) => {
			const step = sensor.shuffleSteps.shift()

			if (step) {
				hadAny = true

				step()
			}
		})

		if (hadAny) {
			process.nextTick(runShift)
		} else {
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
					log(`All of ${target.id} off!! One of [${target.sensors.sort((l, r) => l.id - r.id)}] should have stayed on...`)
				}

				return noCoverage || allOff
			})

			// If any target is uncovered after killing dead sensors, break out here
			if (dead) {
				log("dying!")

				console.log("life:", life)

				return
			}

			const iteration = Math.min(1, weak.battery / weak.range)

			log("iteration:", iteration)

			for (const sensor of sensors) {
				sensor.battery -= sensor.range * iteration

				if (sensor.battery <= 10e-3) {
					sensor.battery = 0
				}
			}

			life += iteration

			iterate()
		}
	}
}
