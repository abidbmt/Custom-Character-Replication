import { Controller, OnStart, OnInit } from "@flamework/core"
import { Players, RunService } from "@rbxts/services"
import { ClientToServer, ReadyPacket } from "client/utils/Blink/Blink"
import { $print } from "rbxts-transform-print"
import { Throttler } from "shared/utils/Throttler"
import { DEBUG_RATE, SEND_RATE } from "./Replication_Shared"

@Controller({})
export class Replication_Controller implements OnStart, OnInit {
	constructor() {}

	private localPlayer = Players.LocalPlayer

	private sendThrottle = new Throttler(SEND_RATE)
	private debugThrottle = new Throttler(DEBUG_RATE)

	private ready = false
	
	onInit() {
		
	}
	
	onStart() {
		RunService.PreRender.Connect((deltaTime) => {
			if (this.sendThrottle.update()) {
				const humanoidRootPart = this.localPlayer.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined
				if (humanoidRootPart === undefined) {return}

				humanoidRootPart.Anchored = false

				if (this.ready === false) {
					this.ready = true
					ReadyPacket.Fire()
				}

				ClientToServer.Fire({
					cframe: humanoidRootPart.CFrame,
					deltaTime: deltaTime
				})
			}

			if (this.debugThrottle.update()) {
				
			}
		})
	}
}