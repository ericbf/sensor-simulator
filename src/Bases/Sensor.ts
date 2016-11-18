import { Positionable } from "./Positionable"
import { Target } from "./Target"

export abstract class Sensor extends Positionable {
	sensors: Sensor[] = []
	targets: Target[] = []

	maxRange: number
	range: number
	battery: number

	preshuffle(): void {
		this.shuffling = true
	}

	/**
	 * This function should be overriden depending on the implementation. It
	 *   should involve communication with all sensors in range, and reshuffling
	 *   of stuff this sensor's range/state.
	 */
	abstract shuffle(): void

	/**
	 * Whether this sensor is currently shuffling, or it has settled into its
	 *   range for the next iteration cycle.
	 */
	shuffling = false

	/**
	 * This is where this sensor receives communications from other sensors.
	 *   This is what you will call on all other sensors in reshuffle, and here
	 *   you'll implement the logic for each protocol.
	 *
	 * @param params - the parameters that were broadcasted.
	 */
	public abstract receiveCommunication(...params: any[]): void

	/**
	 * Use this to store any data needed during the execution of the protocol.
	 */
	storage: any

	constructor(x: number, y: number, battery: number, maxRange: number) {
		super(x, y)

		this.battery = battery
		this.range = this.maxRange = maxRange
	}

	communicate(...params: any[]) {
		for (const sensor of this.sensors) {
			sensor.receiveCommunication.apply(sensor, params)
		}
	}

	/**
	 * Remove this sensor from the targets and sensors with whom it is
	 *   associated.
	 */
	kill() {
		for (const target of this.targets) {
			target.sensors.splice(target.sensors.indexOf(this), 1)
		}

		for (const sensor of this.sensors) {
			sensor.sensors.splice(sensor.sensors.indexOf(this), 1)
		}
	}
}
