import { Controller, OnStart, OnInit } from "@flamework/core"
import { RunService } from "@rbxts/services"
import { ServerToClient } from "client/utils/Blink/Blink"
import { $print, $warn } from "rbxts-transform-print"
import { sendRate } from "./Replication_Shared"
import { Throttler } from "shared/utils/Throttler"

@Controller({})
export class Interpolation_Controller implements OnStart, OnInit {
	constructor() {}

	private snapshotBuffer = new Map<Player, Array<{timeRecieved: number, cframe: CFrame}>>()

	private INTERPOLATION_DELAY = (1 / sendRate) * 3 + 0.05 // 3 packets and 50ms for 2 frames of jitter at 60FPS
		
	onInit() {
		
	}
	
	onStart() {
		ServerToClient.On(({player, cframe}) => {
			const snapshots = this.snapshotBuffer.get(player)
			if (snapshots === undefined) {
				this.snapshotBuffer.set(player, [{timeRecieved: os.clock(), cframe}])
				return
			}

			const now = os.clock()
			for (let i = snapshots.size(); i >= 1; i--) {
				if (now - snapshots[i - 1].timeRecieved > this.INTERPOLATION_DELAY * 2) {
					snapshots.remove(i - 1)
				}
			}
			
			snapshots.push({timeRecieved: os.clock(), cframe})
			this.snapshotBuffer.set(player, snapshots)
		})

		RunService.PostSimulation.Connect((deltaTime) => {
			for (const [player, snapshots] of this.snapshotBuffer) {
				let olderSnapshot = undefined
				let newerSnapshot = undefined

				const now = os.clock()
				const renderTime = now - this.INTERPOLATION_DELAY

				for (let i = 1; i <= snapshots.size(); i++) {
					const snapshot = snapshots[i - 1]
					const nextSnapshot = snapshots[i]
					// $print(snapshots)

					if (nextSnapshot === undefined) {
						//$warn("No next snapshot")
						break
					}

					if (snapshot.timeRecieved <= renderTime && nextSnapshot.timeRecieved >= renderTime) {
						olderSnapshot = snapshot
						newerSnapshot = nextSnapshot
						break
					}
				}

				if (olderSnapshot === undefined || newerSnapshot === undefined) {
					//$warn("No snapshots to interpolate")
					continue
				}

				const interval = newerSnapshot.timeRecieved - olderSnapshot.timeRecieved

				if (interval <= 0) {
					//$warn("Invalid interval")
					continue
				}

				const t = (renderTime - olderSnapshot.timeRecieved) / interval

				const humanoidRootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined
				if (humanoidRootPart === undefined) {continue}

				humanoidRootPart.CFrame = olderSnapshot.cframe.Lerp(newerSnapshot.cframe, t)
			}
		})
	}
}