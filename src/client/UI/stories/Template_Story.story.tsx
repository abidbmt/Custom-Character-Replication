import Vide from "@rbxts/vide"
import { CreateVideStory } from "@rbxts/ui-labs"
import { Template_Frame } from "../components/Template_Frame"

const controls = {}

const story = CreateVideStory({
	vide: Vide,
	controls: controls,
}, (props) => {
	return (
		<Template_Frame>

		</Template_Frame>
	)
})

export = story