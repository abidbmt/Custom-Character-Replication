import {  } from "@rbxts/services"
import { $print } from "rbxts-transform-print"

export class Throttler {
	private lastUpdate = os.clock()
	private lastUpdateError = 0

	constructor(private rate: number) {
		$print(`Created new Throttler with rate: ${rate}`, 3)
	}

	public update() {
		const timePassed = os.clock() - (this.lastUpdate - this.lastUpdateError)

		if (timePassed >= 1 / this.rate) {
			this.lastUpdate = os.clock()
			this.lastUpdateError = timePassed - (1 / this.rate)

			return true
		}

		return false
	}

	public getRate() {
		return this.rate
	}

	public setRate(rate: number) {
		this.rate = rate
	}
}