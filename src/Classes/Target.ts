import { Positionable } from "./Positionable"
import { Shuffleable } from "../Interfaces/Shuffleable"

export class Target extends Positionable {
	sensors: Shuffleable[] = []
}
