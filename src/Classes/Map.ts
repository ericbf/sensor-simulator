export class Map<K, V> {
	private keys: K[] = []
	private values: V[] = []

	put(key: K, value: V) {
		const index = this.keys.indexOf(key)

		if (index >= 0) {
			this.values[index] = value
		} else {
			this.keys.push(key)
			this.values.push(value)
		}

		return value
	}

	get(key: K) {
		const index = this.keys.indexOf(key)

		if (index >= 0) {
			return this.values[index]
		}

		return undefined
	}

	remove(key: K) {
		const index = this.keys.indexOf(key)

		if (index >= 0) {
			this.keys.splice(index, 1)
			return this.values.splice(index, 1)[0]
		}

		return undefined
	}

	contains(key: K) {
		return this.get(key) != undefined
	}

	empty() {
		this.keys.length = 0
		this.values.length = 0
	}

	getOrPut(key: K, value: V) {
		const val = this.get(key)

		if (val == undefined) {
			return this.put(key, value)
		}

		return val
	}
}
