import { Controller, OnStart, OnInit } from "@flamework/core"
import { RunService } from "@rbxts/services"
import { ServerToClient } from "client/utils/Blink/Blink"
import { $print, $warn } from "rbxts-transform-print"
import { SEND_INTERVAL, SEND_RATE } from "./Replication_Shared"
import { Throttler } from "shared/utils/Throttler"

@Controller({})
export class Interpolation_Controller implements OnStart, OnInit {
	constructor() {}

	private snapshotBuffers = new Map<Player, Array<{timeRecieved: number, cframe: CFrame, deltaTime: number}>>()
	private alphaThrottle = new Throttler(1)

	private sendRates = new Map<Player, number>()
	private startTimes = new Map<Player, number>()
		
	onInit() {
		
	}
	
	onStart() {
		ServerToClient.On(({player, cframe, deltaTime}) => {
			this.sendRates.set(player, (this.sendRates.get(player) ?? 0) + 1)
			if (this.sendRates.get(player) === 60) {
				print(`Player ${player.Name} has sent 60 packets! (${string.format("%.2f", os.clock() - (this.startTimes.get(player) ?? 0))}s)`)
				this.sendRates.set(player, 0)
				this.startTimes.set(player, os.clock())
			}

			const INTERPOLATION_DELAY = math.max(SEND_INTERVAL, deltaTime) * 3 + deltaTime * 3

			let snapshotBuffer = this.snapshotBuffers.get(player)
			if (snapshotBuffer === undefined) {
				snapshotBuffer = [{timeRecieved: os.clock(), cframe: cframe, deltaTime: deltaTime}]
				this.snapshotBuffers.set(player, snapshotBuffer)
				// $print(this.snapshotBuffers)
				// $print(`${string.format("%.4f", math.max(SEND_INTERVAL, deltaTime))} * 3 + ${string.format("%.4f", deltaTime)} * 3`)
				return
			}

			const now = os.clock()
			for (let i = snapshotBuffer.size(); i >= 1; i--) {
				if (now - snapshotBuffer[i - 1].timeRecieved > INTERPOLATION_DELAY * 2) {
					snapshotBuffer.remove(i)
				}
			}

			snapshotBuffer.unshift({timeRecieved: os.clock(), cframe: cframe, deltaTime: deltaTime})
			// $print(this.snapshotBuffers)
			// $print(`${string.format("%.4f", math.max(SEND_INTERVAL, deltaTime))} * 3 + ${string.format("%.4f", deltaTime)} * 3`)
		})

		RunService.BindToRenderStep("interpolation", 0, (deltaTime) => {
			for (const [player, snapshotBuffer] of this.snapshotBuffers) {
				if (snapshotBuffer.size() < 2) {
					$warn("Too few snapshots")
					continue
				}

				let olderSnapshot = undefined
				let newerSnapshot = undefined

				const INTERPOLATION_DELAY = math.max(SEND_INTERVAL, snapshotBuffer[1 - 1].deltaTime) * 3 + snapshotBuffer[1 - 1].deltaTime * 3

				const now = os.clock()
				let renderTime = now - INTERPOLATION_DELAY

				for (let i = snapshotBuffer.size(); i >= 1; i--) {
					const snapshot = snapshotBuffer[i - 1]
					const nextSnapshot = snapshotBuffer[i - 2]

					if (nextSnapshot === undefined) {
						// $warn("No next snapshot (too few snapshots)")
						break
					}

					if (snapshot.timeRecieved <= renderTime && nextSnapshot.timeRecieved >= renderTime) {
						olderSnapshot = snapshot
						newerSnapshot = nextSnapshot
						break
					}
				}

				if (olderSnapshot === undefined || newerSnapshot === undefined) {
					if (renderTime > snapshotBuffer[1 - 1].timeRecieved) {
						warn(`Render time is too early (${string.format("%.4f", (renderTime - snapshotBuffer[1 - 1].timeRecieved) * 1000)}ms)`)
						olderSnapshot = snapshotBuffer[2 - 1]
						newerSnapshot = snapshotBuffer[1 - 1]
						renderTime = newerSnapshot.timeRecieved - (newerSnapshot.timeRecieved - olderSnapshot.timeRecieved) / 2
					}
					if (renderTime < snapshotBuffer[snapshotBuffer.size() - 1].timeRecieved) {
						warn(`Render time is too late (${string.format("%.4f", (snapshotBuffer[snapshotBuffer.size() - 1].timeRecieved - renderTime) * 1000)}ms)`)
						olderSnapshot = snapshotBuffer[snapshotBuffer.size() - 1]
						newerSnapshot = snapshotBuffer[snapshotBuffer.size() - 2]
						renderTime = newerSnapshot.timeRecieved - (newerSnapshot.timeRecieved - olderSnapshot.timeRecieved) / 2
					}
					warn(`Newest snapshot time: ${string.format("%.4f", snapshotBuffer[1 - 1].timeRecieved)}`)
					warn(`Render time: ${string.format("%.4f", renderTime)}`)
					warn(`Oldest snapshot time: ${string.format("%.4f", snapshotBuffer[snapshotBuffer.size() - 1].timeRecieved)}\n`)
				}

				const interval = newerSnapshot!.timeRecieved - olderSnapshot!.timeRecieved

				if (interval <= 0) {
					// $warn("Interval is less than or equal to 0 (snapshots are too close together)")
					continue
				}

				const alpha = (renderTime - olderSnapshot!.timeRecieved) / interval
				// if (this.alphaThrottle.update()) {
				// 	$print(`Alpha: ${string.format("%.4f", alpha)}`)
				// }

				const humanoidRootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined
				if (humanoidRootPart === undefined) {continue}

				humanoidRootPart.CFrame = olderSnapshot!.cframe.Lerp(newerSnapshot!.cframe, alpha)
			}
		})
	}
}