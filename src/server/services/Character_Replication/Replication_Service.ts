import { Service, OnStart, OnInit } from "@flamework/core"
import {  } from "@rbxts/services"
import {  } from "rbxts-transform-print"
import { ClientToServer, ReadyPacket, ServerToClient } from "server/utils/Blink/Blink"

@Service({})
export class Replication_Service implements OnStart, OnInit {
	constructor() {}
	
	onInit() {
		
	}
	
	onStart() {
		ReadyPacket.On((player) => {
			const character = player.Character ?? player.CharacterAppearanceLoaded.Wait()[0]
			const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as Part

			humanoidRootPart.Anchored = true
		})

		ClientToServer.On((player, {cframe}) => {
			ServerToClient.FireExcept(player, {player, cframe})
		})
	}
}