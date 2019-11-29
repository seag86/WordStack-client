import Matter from "matter-js";

let lastDelta = 16

export default {

 	updateEngine: ( engine, delta ) => {

 		const correction = delta / lastDelta 
 		lastDelta = delta
 		Matter.Engine.update(engine, delta, correction)
 		return engine
 	},
 	preCalculation: ( entities, animating, height, width, maxSelectVelosity, boxes, roundBoxes, frames, currentFrame, animFramesCount, MAX_TIME_DELTA ) => {
 		this.calcData = {
		  	animating: animating,
		  	entities: entities,
		  	frames: frames, 
		  	currentFrame: currentFrame,
		  	animFramesCount: animFramesCount,
		  	end: true
		  }
 	},
 	bodySwitch: (entities, boxes) => {

 		for(let box of boxes){

			let id = box.id
			entities[id].bodyAnim.position.x = entities[id].body.position.x
			entities[id].bodyAnim.position.y = entities[id].body.position.y
			entities[id].bodyAnim.angle = entities[id].body.angle
		}
		return entities
	},

	getData: () => {
		return this.calcData
	},

	setClear: () => {
		this.calcData = {}

	},

	calcData: {},
}
