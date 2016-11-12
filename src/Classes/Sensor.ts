import { Communicatable } from "../Interfaces/Communicatable"
import { Positionable } from "./Positionable"
import { Target } from "./Target"

export abstract class Sensor extends Positionable implements Communicatable {
	sensors: Communicatable[] = []
	targets: Target[] = []

	range = 0
	isStandby = true

	battery: number

	/**
	 * This function should be overriden depending on the implementation. It
	 *   should involve communication with all sensors in range, and reshuffling
	 *   of stuff this sensor's range/state
	 */
	abstract reshuffle(): void

	/**
	 * This is where this sensor receives communications from other sensors.
	 *   This is what you will call on all other sensors in reshuffle, and here
	 *   you'll implement the logic for each protocol.
	 *
	 * @param {any[]} ...params [description]
	 */
	public abstract receiveCommunication(...params: any[]): void

	/**
	 * Use this to store any data needed during the execution of the protocol.
	 */
	storage: any

	constructor(x: number, y: number, battery: number) {
		super(x, y)

		this.battery = battery
	}
}
