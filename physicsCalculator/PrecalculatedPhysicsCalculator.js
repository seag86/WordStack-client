import Matter from "matter-js";

export default {

 	updateEngine: ( engine, delta ) => {
 		return engine
 	},

 	preCalculation: ( entities, animating, height, width, maxSelectVelosity, boxes, roundBoxes, frames, currentFrame, animFramesCount, MAX_TIME_DELTA ) => {

	  let isCalm = false
	  let zeroMovements = false
	  let zeroMovementsFrame = 0
	  const frameTime = MAX_TIME_DELTA
	  let count = 0
	  let animBoxes = boxes.filter ( box  => roundBoxes.indexOf(box) < 0)
	  let screenBoxes = animBoxes

	  //--- update animation, set bodies back to current frame --------
	  if(animating) {

	    const frame = frames[MAX_TIME_DELTA * currentFrame]

	    for(let box of frame) {

	        Matter.Body.setPosition(entities[box.id].body, {x: box.x, y: box.y})
	        Matter.Body.setAngle(entities[box.id].body, box.angle)
	        Matter.Body.setVelocity(entities[box.id].body, {x: box.velocityX, y: box.velocityY})
	        Matter.Body.setAngularVelocity(entities[box.id].body, box.angularVelocity)
	      }
	      frames = {}
	      currentFrame = 0
	      animFramesCount = 0
	  }
	  //--- record -------------------------------
	  while( !isCalm ) { 
	    
	    Matter.Engine.update( entities["physics"].engine, frameTime )

	    let frame = []
	    for( let  box of animBoxes ){

	      frame.push({ 
	       id: box.id,
	       x: box.body.position.x,
	       y: box.body.position.y,
	       angle: box.body.angle,
	       velocityX: box.body.velocity.x,
	       velocityY: box.body.velocity.y,
	       angularVelocity: box.body.angularVelocity,
	      })
	    }
	    frames[ frameTime * count ] = frame
	    count++

	    // filter offscreen boxes
	    for( let  box of screenBoxes ){

	      const isOffScreen = box.body.position.y > height + 50 || box.body.position.y < -50 || 
	                            box.body.position.x > width + 50 || box.body.position.x < -50

	      if(isOffScreen) screenBoxes = screenBoxes.filter( sb => sb !== box)
	    }

	    // check movements 
	    for(let box of screenBoxes){
	      if( box.body.velocity.x < maxSelectVelosity && box.body.velocity.y < maxSelectVelosity ){
	        zeroMovements = true     
	      }else{ 
	        zeroMovements = false
	        break
	      }
	    }
	    zeroMovements ? zeroMovementsFrame++ : zeroMovementsFrame = 0

	    // stop calc if zero movements during Xms/frameTime frames 
	    if( zeroMovements && zeroMovementsFrame > 500/frameTime || screenBoxes.length == 0 ){
	      isCalm = true
	    }
	  }

	  animFramesCount = count
	  animating = true

	  this.calcData = {
		  	animating: animating,
		  	entities: entities,
		  	frames: frames, 
		  	currentFrame: currentFrame,
		  	animFramesCount: animFramesCount,
		}
	},

	bodySwitch: (entities) => {
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
