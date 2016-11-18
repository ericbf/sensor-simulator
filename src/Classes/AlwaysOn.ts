import { Sensor } from "../Bases/Sensor"
import { Target } from "../Bases/Target"

export class AlwaysOn extends Sensor {
	shuffle() { this.shuffling = false }
	receiveCommunication() {}
}
