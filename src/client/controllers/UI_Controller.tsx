import Vide, { mount } from "@rbxts/vide"
import { Controller, OnStart, OnInit } from "@flamework/core"
import { Players } from "@rbxts/services"
import {  } from "rbxts-transform-print"
import { Base_App } from "client/UI/apps/Base_App"

@Controller({})
export class UI_Controller implements OnStart, OnInit {
	constructor() {}
	
	onInit() {
		
	}
	
	onStart() {
		mount(() => <Base_App />, Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui)
	}
}