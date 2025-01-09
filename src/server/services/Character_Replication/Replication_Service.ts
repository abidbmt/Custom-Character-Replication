import { Service, OnStart, OnInit } from "@flamework/core"
import { Players } from "@rbxts/services"
import { $print } from "rbxts-transform-print"
import { ClientToServer, ReadyPacket, ServerToClient } from "server/utils/Blink/Blink"
import { Throttler } from "shared/utils/Throttler"

@Service({})
export class Replication_Service implements OnStart, OnInit {
	constructor() {}

	private sendRates = new Map<Player, number>()
	private startTimes = new Map<Player, number>()
	
	onInit() {
		
	}
	
	onStart() {
		ReadyPacket.On((player) => {
			const character = player.Character ?? player.CharacterAppearanceLoaded.Wait()[0]
			const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as Part

			humanoidRootPart.Anchored = true
		})

		ClientToServer.On((player, {cframe, deltaTime}) => {
			// // Packet loss simulation
			// if (math.random() > 0.5) {
			// 	ServerToClient.FireExcept(player, {player, cframe, deltaTime})
			// }
			ServerToClient.FireExcept(player, {player, cframe, deltaTime})
			// ServerToClient.FireAll({player, cframe, deltaTime})
			this.sendRates.set(player, (this.sendRates.get(player) ?? 0) + 1)
			if (this.sendRates.get(player) === 60) {
				print(`Player ${player.Name} has sent 60 packets! (${string.format("%.2f", os.clock() - (this.startTimes.get(player) ?? 0))}s)`)
				this.sendRates.set(player, 0)
				this.startTimes.set(player, os.clock())
			}
		})
	}
}