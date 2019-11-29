import Matter from "matter-js";
import { Dimensions } from 'react-native'
const { width, height } = Dimensions.get("screen")
import io from 'socket.io-client'
const socket = io('http://192.168.0.6:3002')

console.ignoredYellowBox = ['Remote debugger'];
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings([
    'Unrecognized WebSocket connection option(s) `agent`, `perMessageDeflate`, `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`. Did you mean to put these under `headers`?'
]);

let syncStep = 0
let time = 0
let framesBuffer = {}
const MAX_TIME_DELTA = 16

socket.emit('beginGame', { width: width, height: height })


socket.on('frame', data => {
	if(data.step == syncStep){

		framesBuffer[ data.count ] = data.frame
		this.calcData.frames = framesBuffer
		this.calcData.animFramesCount = data.count
		// preloading buffer
		if( data.count > 10 ) this.calcData.animating = true
	}
})

socket.on('calcDone', data => { 
	if(!data.error[0]){
		//if( syncStep == data.step ){
			this.calcData.end = data.end
			//this.calcData.frames = data.frames
			//this.calcData.animFramesCount = data.animFramesCount
			//this.calcData.animating = true

			//time = new Date().getTime() - time	
			//console.log(time, 'ms calc+transfer')

		//}else this.calcData.error = "Error: wrong server data"
	}else{
		this.calcData.error = "Error: " + data.error.join('; ')
	}
})

export default {

 	updateEngine: ( engine, delta ) => {
 		return engine
 	},

 	preCalculation: ( entities, animating, height, width, maxSelectVelosity, boxes, roundBoxes, frames, currentFrame, animFramesCount, MAX_TIME_DELTA, step, idStartBox ) => {

 		let boxesId = []
 		for(let box of boxes){
 			boxesId.push(box.id)
 		}

 		let calcQuery = {
 			boxesId: boxesId,
 			animating: animating,
 			currentFrame: currentFrame,
 			idStartBox: idStartBox,
 			step: step
 		}
 		if( idStartBox != -1 ){
 			calcQuery.positionX = entities[idStartBox].body.position.x
 			calcQuery.positionY = entities[idStartBox].body.position.y
 			calcQuery.velosityX = entities[idStartBox].body.velocity.x
 			calcQuery.velosityY = entities[idStartBox].body.velocity.y

 			// clear velocity
	 		Matter.Body.setVelocity(entities[idStartBox].body, {x: 0, y: 0 })
		    Matter.Body.setAngularVelocity(entities[idStartBox].body, 0 )
 		}

 		//time = new Date().getTime()

 		socket.emit('calcData', calcQuery )

	    entities.floor.letter = "data transfer"
	    syncStep = step
	    framesBuffer = {}

		this.calcData = {
			animating: false,
			entities: entities,
			end: false
		}

	},

	bodySwitch: (entities, boxes) => {

		// set matter bodys to animation positions		
	    for(let box of boxes){

			let id = box.id
			Matter.Body.setPosition(entities[id].body, {x: entities[id].bodyAnim.position.x, y: entities[id].bodyAnim.position.y})
	    	Matter.Body.setAngle(entities[id].body, entities[id].bodyAnim.angle)
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
