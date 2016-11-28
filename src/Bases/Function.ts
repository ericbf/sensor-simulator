type MemoizeOptions = {
	/**
	 * Array of indices to skip as keys. Default is `[]`.
	 */
	excludedArguments?: number[]

	/**
	 *  Number of params expected. Arguments will be truncated or padded to
	 *    reach this number. Default is num of parameters of first call.
	 */
	argumentsCount?: number

	/**
	 * Whether it is an async function. Defalut is `false`,
	 */
	asynchronous?: boolean
}

type Cache = {
	[key: string]: Cache | any

	value?: any
}

interface Function {
	/**
	 * This allows the arguments of this function to be bound to given values,
	 *   similar to bind, but it doesn't affect the `this` parameter. It returns
	 *   a callback that accepts the parameters that are left.
	 *
	 * @param firstArgument - the thing to bind as the first arument
	 *
	 * @return - the bound function
	 */
	curry(...args: any[]): any

	/**
	 * This memoizes a function that takes non-function parameters as the keys.
	 *   It necessarily means that the same inputs will always result in the
	 *   same outputs. If this isn't true, the memoized function will return
	 *   incorrect values for future calls. Non-string arguments are JSONified
	 *   before using as a key.
	 *
	 * @param {T} func - the function to be memoized
	 * @param {IMemoizeOptions} options - the options for this function
	 *
	 * @return {T} the memoized version of the function
	 */
	memoize<T extends Function>(this: T, options?: MemoizeOptions): T

	/**
	 * Returns a function that will only be called once every however many
	 *   milliseconds, no matter how many times it is invoked in that time,
	 *
	 * @param: number - how long to wait, in milliseconds. Default is `0`.
	 * @param: imediate - whether to call on the leading edge or the trailing
	 *   edge. Default is `true`.
	 */
	throttle<T extends Function>(this: T, wait?: number, immediate?: boolean): T

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not
	 *   be triggered. The function will be invoked after it stops being invoked
	 *   for however many milliseconds.
	 *
	 * @param: number - how long to wait, in milliseconds. Default is `0`.
	 * @param: imediate - whether to call on the leading edge or the trailing
	 *   edge. Default is `fase`.
	 */
	debounce<T extends Function>(this: T, wait?: number, immediate?: boolean): T
}

(() => {
	let $$memoizeUniqueId = 0

	Object.defineProperties(Function.prototype, {
		curry: {
			value: function curry<T extends Function>(this: T, ...args: any[]) {
				const that = this

				return function curried(this: any) {
					return that.apply(this, args.concat(Array.prototype.slice.call(arguments, 0)))
				}
			}
		},

		memoize: {
			value: function memoize<T extends Function>(this: T, options: MemoizeOptions = {}): T {
				// Default options
				const defaults: MemoizeOptions = {
					excludedArguments: [],
					argumentsCount: undefined,
					asynchronous: false
				}

				for (const key in defaults) {
					if (!(key in options)) {
						options[key] = defaults[key]
					}
				}

				const that = this,
					cache: Cache = {}

				return function memoized(this: any) {
					const keys = Array.prototype.filter.call(arguments, function removeFromKeys(obj: any, index: number) {
						return options.excludedArguments!.indexOf(index) < 0
					})

					if (typeof options.argumentsCount === "number" && isFinite(options.argumentsCount)) {
						keys.length = options.argumentsCount
					} else if (keys.length !== options.argumentsCount) {
						options.argumentsCount = keys.length
					}

					let subcache = cache

					while (keys.length) {
						let argument: string | any = keys.shift()

						// If the parameter is not a string, stringify it to JSON
						if (typeof argument !== "string") {
							try {
								if (!("$$memoizeUniqueId" in argument)) {
									Object.defineProperty(argument, "$$memoizeUniqueId", {
										value: $$memoizeUniqueId++ + "_$$memoizeUniqueId"
									})
								}

								argument = argument.$$memoizeUniqueId
							} catch (e) {
								try {
									argument = JSON.stringify(argument)
								} catch (e) {
									argument = String(argument)
								}
							}
						}

						if (!(argument in subcache)) {
							subcache = subcache[argument] = {}
						} else {
							subcache = subcache[argument]
						}
					}

					if (!("value" in subcache)) {
						subcache.value = that.apply(this, arguments)

						if (options.asynchronous) {
							subcache.value.catch(function unsave() {
								delete subcache.value
							})
						}
					}

					return subcache.value
				} as any
			}
		},

		throttle: {
			value: function throttle<T extends Function>(this: T, wait = 0, immediate = true): T {
				const func = this

				let timeout: any

				return function throttled(this: any) {
					const context = this,
						args = arguments

					if (immediate && !timeout) {
						func.apply(context, arguments)
					}

					if (!timeout) {
						timeout = setTimeout(() => {
							timeout = undefined

							if (!immediate) {
								func.apply(context, args)
							}
						}, wait)
					}
				} as any
			}
		},

		debounce: {
			value: function debounce<T extends Function>(this: T, wait = 0, immediate = false): T {
				const func = this

				let timeout: any

				return function debounced(this: any) {
					const context = this,
						args = arguments

					if (immediate && !timeout) {
						func.apply(context, args)
					}

					clearTimeout(timeout)
					timeout = setTimeout(() => {
						timeout = undefined

						if (!immediate) {
							func.apply(context, args)
						}
					}, wait)
				} as any
			}
		}
	})
})()
