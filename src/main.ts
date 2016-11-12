import readline = require("readline")

const buffer = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

buffer.question("What is your name? ", (name: string) => {
	console.log(`Hello ${name}!!`)

	buffer.close()
})
