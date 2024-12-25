import { Controller, OnStart, OnInit } from "@flamework/core"
import {  } from "@rbxts/services"
import { $print } from "rbxts-transform-print"

@Controller({})
export class Template_Controller implements OnStart, OnInit {
	constructor() {}
	
	onInit() {
		$print("Initialized!")
	}
	
	onStart() {
		$print("Started!")
	}
}