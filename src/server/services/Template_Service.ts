import { Service, OnStart, OnInit } from "@flamework/core"
import {  } from "@rbxts/services"
import { $print } from "rbxts-transform-print"

@Service({})
export class Template_Service implements OnStart, OnInit {
	constructor() {}
	
	onInit() {
		$print("Initialized!")
	}
	
	onStart() {
		$print("Started!")
	}
}