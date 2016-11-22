let id = 0

export abstract class Positionable {
	id = String(id++)

	x: number
	y: number

	distanceTo(other: Positionable) {
		return Math.sqrt(this.rangeTo(other))
	}

	rangeTo(other: Positionable) {
		return Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
	}

	constructor(x: number, y: number) {
		this.x = x
		this.y = y
	}
}
