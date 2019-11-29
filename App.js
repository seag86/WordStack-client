import React from 'react';
import { Dimensions, StyleSheet, Text, View, StatusBar, ImageBackground } from 'react-native';
import Matter from "matter-js";
import { GameEngine } from "react-native-game-engine";
import RealtimePhysicsCalculator from './physicsCalculator/RealtimePhysicsCalculator';
//import PrecalculatedPhysicsCalculator from './physicsCalculator/PrecalculatedPhysicsCalculator';
import PrecalculatedPhysicsCalculator from './physicsCalculator/ClientPhysicsCalculator';

import Box from './Box';
import Block from './Block';
import Point from './Point';

// import loadLocalResource from 'react-native-local-resource'
// import myResource from './assets/words_alpha_min.txt' //words_alpha words10k words_alpha_min

// let dict
// loadLocalResource(myResource).then((file) => {

//   let dictArr = file.split(' ')
//   //let dictArr = file.split('\n')
  
//   //dictArr = dictArr.map(w => w.trim())
//   dict = new Set(dictArr)
//   //console.log("words count in dictionary: ", dictArr.length )

// }).catch( (error) => { /*console.log(error.message)*/ } )

import file from './assets/words_alpha'
const dict = new Set(file.split(' '))

const { width, height } = Dimensions.get("screen");
const boxSize = Math.trunc(Math.max(width, height) * 0.074);
const engine = Matter.Engine.create({ enableSleeping: true });
const gravity = {...engine.world.gravity};
engine.world.gravity.x = 0;
engine.world.gravity.y = 0;
const world = engine.world;
const floor = Matter.Bodies.rectangle(width / 2, height - boxSize, width * 3 / 4, boxSize, { isStatic: true });
Matter.World.add(world, [floor]);
let engineStatus = true;
const MAX_TIME_DELTA = 16 // 20ms(50fps) 16ms(60fps)
const MAX_BOX_VELOCITY_INCREASE = 4
const MAX_BOX_SPEED = 10
const maxSelectVelosity = 0.05
const maxBoxDistanse = 1.5
let calcSwitch = false
let physicsCalculator
const roundZoneHeight = height / 4;


const Physics = (entities, { time }) => {

  physicsCalculator = calcSwitch ? RealtimePhysicsCalculator : PrecalculatedPhysicsCalculator

  let engine = entities["physics"].engine;
  entities["physics"].engine = physicsCalculator.updateEngine( engine, Math.min(time.delta, MAX_TIME_DELTA) )
  return entities;
};

Matter.Events.on(engine, "beforeUpdate", () => {
  const bodies = Matter.Composite.allBodies(engine.world);

  for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];

      if (body.isStatic || body.isSleeping || body.ignoreGravity) {
        continue;
      }

      body.force.x += gravity.x * gravity.scale * body.mass;
      body.force.y += gravity.y * gravity.scale * body.mass;
  }
});

let boxIds = 0;

let boxes = []

let letterFrequencies = {
  "E": 10,
  "T": 10,
  "A": 10,
  "O": 10,
  "I": 10,
  "N": 10,
  "S": 10,
  "R": 10,
  "H": 10,
  "D": 8,
  "L": 7,
  "U": 5,
  "C": 5,
  "M": 5,
  "F": 4,
  "Y": 4,
  "W": 4,
  "G": 4,
  "P": 3,
  "B": 3,
  "V": 2,
  "K": 1,
  "X": 1,
  "Q": 1,
  "J": 1,
  "Z": 1
}

function weightedRandomLetter() {
  const sum = Object.values(letterFrequencies).reduce((a, b) => a + b)

  var random = Math.floor(Math.random() * sum)

  for(let letter in letterFrequencies) {
    const frequency = letterFrequencies[letter]
    random -= frequency
    if(random < 0) {
      return letter
    }
  }

  return 'Z'
}

let roundBoxes = [];
let canCreateNewRound = true;
let movingBox;
let movingBoxPrevPosition;

let isFingerDown = false;
let fingerPosition = null;

let prevBox = []
let markEntityIds = []
let markBoxIds = []
let word = ''
let score = 0
let zeroVelosity // no movements
let startBox
let directionPoint
let frames = {} // frames[ frame_number ][box.id].x 
let currentFrame = 0
let animFramesCount = 0
let animating = false
let dataTransfer = false
let transferTime = 0
let sdeedCoef = 1
let step = 0

const startRound = (entities, { touches, screen }) => {
  const world = entities["physics"].world;

  const bodies = [
    Matter.Bodies.rectangle(
      Math.trunc(screen.width / 6),
      Math.trunc(roundZoneHeight / 2),
      boxSize,
      boxSize,
      {
        ignoreGravity: true,
        frictionAir: 0,
        restitution: 0
      }
    ),
    Matter.Bodies.rectangle(
      Math.trunc(screen.width / 2),
      Math.trunc(roundZoneHeight / 2),
      boxSize,
      boxSize,
      {
        ignoreGravity: true,
        frictionAir: 0,
        restitution: 0
      }
    ),
    Matter.Bodies.rectangle(
      Math.trunc(5 * screen.width / 6),
      Math.trunc(roundZoneHeight / 2),
      boxSize,
      boxSize,
      {
        ignoreGravity: true,
        frictionAir: 0,
        restitution: 0
      }
    ),
  ];

  const position1 = { x: Math.trunc(screen.width / 6), y: Math.trunc(roundZoneHeight / 2)}
  const position2 = { x: Math.trunc(screen.width / 2), y: Math.trunc(roundZoneHeight / 2)}
  const position3 = { x: Math.trunc(5 * screen.width / 6), y: Math.trunc(roundZoneHeight / 2)}
  let bodyAnim = []
  bodyAnim.push({ position: position1, angle: 0 })
  bodyAnim.push({ position: position2, angle: 0 })
  bodyAnim.push({ position: position3, angle: 0 })

  for(let body of bodies) {
    entities[++boxIds] = {
      id: boxIds,
      body: body,
      bodyAnim: bodyAnim[ (boxIds-1)%3 ],
      size: [boxSize, boxSize],
      //color: boxIds % 2 == 0 ? "pink" : "#B8E986",
      letter: weightedRandomLetter(),
      renderer: Box,
      letterAngle: 0,
      selected: false,
    };
    boxes.push(entities[boxIds]);
    roundBoxes.push(entities[boxIds]);
    body.ignoreGravity = true;
  }

  startBox = roundBoxes[0].body
  entities[startBox.id-1].selected = true

  Matter.World.add(world, bodies);
  canCreateNewRound = false;
}


function normalizeVector(x, y, maxLength) {
  const normal = Math.sqrt(x * x + y * y)

  const targetNormal = Math.min(normal, maxLength)
  
  if(targetNormal <= maxLength) {
    return { x, y }
  }

  const newX = x * targetNormal / normal
  const newY = y * targetNormal / normal

  return {
    x: newX,
    y: newY
  }
}

const GameCore = (entities, { touches, screen, time }) => {

  if (roundBoxes.length === 0 && canCreateNewRound) {
    startRound(entities, { touches, screen })
  }

  // check for movements
  for(let box of boxes){

    if( box.body.velocity.x < maxSelectVelosity && box.body.velocity.y < maxSelectVelosity ){
      zeroVelosity = true
    }else{ 
      zeroVelosity = false
      break
    }
  }
  // create new round if zeroVelosity during 1s
  if( roundBoxes.length === 0 && zeroVelosity && !animating || boxes.length == 0 ){
    setTimeout(() => {
          if( roundBoxes.length === 0 && zeroVelosity && !animating || boxes.length == 0 ) {
            canCreateNewRound = true
          }
  }, 1000)}

  // clear fallen boxes from roundBoxes, get gravity, set velocity
  for(let roundBox of roundBoxes) {
    if(roundBox.body.position.y > roundZoneHeight) {
      roundBoxes = roundBoxes.filter(rb => rb !== roundBox);

      if(roundBox.body == movingBox) {
        movingBox = undefined;
      }

      roundBox.body.ignoreGravity = false;
      Matter.Sleeping.set(roundBox.body, false);
      // console.log('roundBoxes', roundBoxes.length) 
      if ( roundBoxes.length === 0 ) { 
          //canCreateNewRound = true;
      }
    } else {
      const {x: velocityX, y: velocityY} = {...roundBox.body.velocity};

      Matter.Body.setVelocity(roundBox.body,  { x: velocityX * 0.98, y: velocityY * 0.98 });
    }
  }

  const startTouch = touches.find(x => x.type == 'start')
  const moveTouch = touches.find(x => x.type == 'move')
  const endTouch = touches.find(x => x.type == 'end')

  if(startTouch) {
    isFingerDown = true;
  }

  if(endTouch) {
    isFingerDown = false;
    fingerPosition = null;
    movingBox = null;
  }

  if(moveTouch) {
    fingerPosition = {
      x: moveTouch.event.pageX,
      y: moveTouch.event.pageY
    }
  }
  
  const t = touches[0];
  if(movingBox && !t) {
    if (movingBox.position.y < roundZoneHeight) {
      Matter.Sleeping.set(movingBox, false);
      movingBox.ignoreGravity = true;
      movingBox = undefined;
    }
  }
  if(startTouch || !movingBox && moveTouch) {
    b = Matter.Query.point(roundBoxes.map( box => box.body ), {x: t.event.pageX, y: t.event.pageY})[0];
    if(b) {
      movingBox = b;
      movingBoxPrevPosition = {...movingBox.position};
    }
  }

  //--- calcSwitch-----------------------
  if(startTouch  && (t.event.pageX < boxSize) && (t.event.pageY < boxSize*1.5)) {
    calcSwitch = !calcSwitch 
    entities.buttonSwitch.letter = calcSwitch ? 'R' : 'P'
  }
  
  //--- processing taps on stack area ---

  //--- swipe ---

  let bodiesArr = boxes.map( box => box.body )

  if(isFingerDown && (startTouch || moveTouch ) && (t.event.pageY > roundZoneHeight) ) {   //&& !startBox

    const b = Matter.Query.point( bodiesArr , {x: t.event.pageX, y: t.event.pageY} )[0] 
    // b - Matter.Body

    if(b  && b.velocity.x < maxSelectVelosity && b.velocity.y < maxSelectVelosity){

      let entityId = b.id-1
      let boxId = bodiesArr.indexOf(b)

      let isNear = prevBox[0] && (Math.abs(prevBox[0] - b.position.x) < (maxBoxDistanse*boxSize)) &&
                                 (Math.abs(prevBox[1] - b.position.y) < (maxBoxDistanse*boxSize))
      
      let isThis = (Math.sqrt( Math.pow((t.event.pageX - b.position.x), 2) +
                               Math.pow((t.event.pageY - b.position.y), 2)
                    ) < boxSize/2)

      // mark box if it first marked or near to previous and not exist in markEntityIds array and got to center of cube
      if(!markEntityIds[0] || isNear && !markEntityIds.includes(entityId) && isThis) {

        //entities[entityId].color = "yellow"
        entities[entityId].selected = true
        markEntityIds.push(entityId)
        markBoxIds.push(boxId)
        word = markEntityIds.map( entityId => entities[entityId].letter).join('')
        prevBox = [b.position.x, b.position.y]
        entities.floor.letter = word
      } 
     }   
  }

  //--- end of swipe ---

  if(endTouch && (t.event.pageY > roundZoneHeight) && markEntityIds[0]){

    entities.floor.letter = word 
    // if base exist and contains the word
    if(dict && wordCheck(word)){
      score++
      setTimeout( ()=>{

        // delete elements first from end of array
        markBoxIds.sort((a, b) => b - a)

        for(let entityId of markEntityIds){
          delete entities[entityId]
        }
        for(let boxId of markBoxIds){
          Matter.World.remove(entities.physics.engine.world, boxes[boxId].body)
          boxes.splice((boxId), 1)
        }

        //  preCalculation
        physicsCalculator.preCalculation(
          entities, 
          animating, 
          height, 
          width, 
          maxSelectVelosity,
          boxes, 
          roundBoxes, 
          frames, 
          currentFrame, 
          animFramesCount, 
          MAX_TIME_DELTA,
          step,
          -1
        )
        dataTransfer = true
        animating = false
        currentFrame = 0
        step++

        markEntityIds = []
        markBoxIds = []
        prevBox = []
        word = ""
        entities.floor.letter = score

      }, 1000)

     } else{
      // cancel emphasis
      for(let entityId of markEntityIds){
            //entities[entityId].color = entityId % 2 == 0 ? "pink" : "#B8E986";
            entities[entityId].selected = false
          }
      markEntityIds = []
      markBoxIds = []
      prevBox = []
      word = ""
      setTimeout( ()=>{ entities.floor.letter = score }, 1000)
    } 
  }

  //--- move boxes in round zone -------------------------------------
  // select box to launch
  if(isFingerDown && ( startTouch || moveTouch ) && (t.event.pageY < roundZoneHeight) ) { 

    const b = Matter.Query.point( bodiesArr , {x: t.event.pageX, y: t.event.pageY} )[0]

    if(b){
      if( startBox && b != startBox ) entities[startBox.id-1].selected = false
      startBox = b
      let entityId = startBox.id-1
      let boxId = bodiesArr.indexOf(startBox)
      entities.floor.letter = ""
      entities[startBox.id-1].selected = true
    }
  }

  // move box
  if(isFingerDown && moveTouch && (t.event.pageY < roundZoneHeight) && startBox) { 
    //t.event.pageX t.event.pageY 
    Matter.Body.setPosition(startBox, { x: t.event.pageX, y: t.event.pageY })

    entities[startBox.id-1].bodyAnim.position.x = t.event.pageX
    entities[startBox.id-1].bodyAnim.position.y =  t.event.pageY
  }

  // expect for direction point
  if( isFingerDown  && ( startTouch || moveTouch ) && t.event.pageY > roundZoneHeight &&  t.event.pageY < (height - boxSize*1.5)) {

    directionPoint = [t.event.pageX, t.event.pageY]
    entities["point"] = { position: directionPoint, renderer: Point}
  }

  if( directionPoint && startBox ) {
    // launch
    if( isFingerDown && startTouch && (t.event.pageY > (height - boxSize*1.5)) ){

      sdeedCoef = Math.pow(MAX_BOX_SPEED, t.event.pageX / width) - 1
      entities.floor.letter = "speed: " + Math.ceil((sdeedCoef)*100)/100

      entities[startBox.id-1].selected = false
      roundBoxes = roundBoxes.filter(rb => rb.body !== startBox);

      startBox.ignoreGravity = false;

      // ------------------------------------------------
      movingBoxPrevPosition = {...startBox.position};

      const moveX = (directionPoint[0] - movingBoxPrevPosition.x) * Math.min(time.delta, MAX_TIME_DELTA) / 500
      const moveY = (directionPoint[1] - movingBoxPrevPosition.y) * Math.min(time.delta, MAX_TIME_DELTA) / 500

      const {x: normalizedMoveX, y: normalizedMoveY} = normalizeVector(moveX, moveY, MAX_BOX_VELOCITY_INCREASE)

      const currentVelocity = {...startBox.velocity};

      const velocitySumX = normalizedMoveX//currentVelocity.x + normalizedMoveX
      const velocitySumY = normalizedMoveY//currentVelocity.y + normalizedMoveY

      const {x: targetVelocityX, y: targetVelocityY} = normalizeVector(velocitySumX, velocitySumY, MAX_BOX_SPEED)

      Matter.Body.setVelocity(startBox,  { x: targetVelocityX*sdeedCoef, y: targetVelocityY*sdeedCoef });
      
      Matter.Sleeping.set(startBox, false);
      //----------------------------------------
      // preCalculation
      physicsCalculator.preCalculation(
        entities, 
        animating, 
        height, 
        width, 
        maxSelectVelosity,
        boxes, 
        roundBoxes, 
        frames, 
        currentFrame, 
        animFramesCount, 
        MAX_TIME_DELTA,
        step,
        startBox.id-1,
      )
      dataTransfer = true
      animating = false
      currentFrame = 0
      step++

      // set default box
      if(roundBoxes[0]){
        startBox = roundBoxes[0].body
        entities[startBox.id-1].selected = true
      }else startBox = undefined
    }
  }

  //--- get calculated data ----------------------------------------
  const calcData = physicsCalculator.getData()
  if( calcData && calcData.animating == true ) {
    
    ({
      animating,
      entities,
      frames,
      animFramesCount
    } = calcData)  
  }

  if( calcData && calcData.end){
    dataTransfer = false
  }

  if( calcData && calcData.error ) {
    entities.floor.letter = calcData.error
    physicsCalculator.setClear()
  }
  //--- play recorded animation ----------------------------------------
  if( animating ){

    if( currentFrame == animFramesCount ){
      frames = {}
      currentFrame = 0
      animFramesCount = 0
      animating = false
      entities.floor.letter = "next"
      physicsCalculator.setClear()
    }
  
    if( currentFrame < animFramesCount ){

      const frame = frames[currentFrame]
      for(let box of frame) {

        entities[box.id].bodyAnim.position.x = box.x
        entities[box.id].bodyAnim.position.y = box.y
        entities[box.id].bodyAnim.angle = box.angle
      }

      // correction for true animation speed
      const nextFrame = Math.round( Math.max(time.delta, MAX_TIME_DELTA)/MAX_TIME_DELTA)
      currentFrame < 2 ? currentFrame++ : currentFrame += nextFrame
      //currentFrame += nextFrame
 
      // every frame
      //currentFrame++
      if(currentFrame > animFramesCount){
        currentFrame = animFramesCount
      }

      entities.floor.letter = "buffer: " + (animFramesCount - currentFrame)
    }
    
  }

  //----------------------------------------

  return entities;
};

const wordCheck = (word) =>{

  if((word.length > 2) && dict.has(word.toLowerCase()) ) {

    return true
  }else return false
}

let frameId = 0

const RemoveOffScreenBoxes = (entities, info) => {

  // stop cleaning during marking and animating
  if( markEntityIds[0] ) return entities
  if( animating ) return entities 
  if( dataTransfer ) return entities 

  frameId++ 
  
  if(boxes.length > 0) {
    frameId = frameId % boxes.length

    const boxId = frameId

    const box = boxes[boxId]

    const isOffScreen = box.body.position.y > height + 50 || box.body.position.y < -50 || 
                        box.body.position.x > width + 50 || box.body.position.x < -50

    if(isOffScreen) {
      Matter.World.remove(entities.physics.engine.world, box.body)
      boxes.splice(boxId, 1)
      delete entities[box.id]
    }
  }

  return entities;
};

let frameCount = 0
let fps = 'n/a'
const Rotations = (entities) => {


  for( let box of boxes ){

          //const angleDeviation = -1 * box.body.angle 
          const angleDeviation = -1 * entities[box.id].bodyAnim.angle
      
          const stickAngle = ( Math.round(angleDeviation / (Math.PI/2)) * (Math.PI/2) ) 
          // smoothness
          const delta = ( stickAngle - entities[box.id].letterAngle  ) / 5
          entities[box.id].letterAngle += delta
  }

  // fps meter
  frameCount++
  entities.floor.text = " fps: " + fps
  return entities
}

setInterval( ()=>{
    fps = frameCount
    frameCount = 0
}, 1000)

// realtime/animation visual behaviour 
const bodySwitch = (entities) => {

  return physicsCalculator.bodySwitch(entities, boxes)
}

export default class App extends React.Component {

  render() {

    return (
      <ImageBackground
          source={require('./assets/space.png')} 
          style={styles.background}
        >
        <GameEngine
          style={styles.container}
          systems={[Physics, GameCore, RemoveOffScreenBoxes, Rotations, bodySwitch]} // Array of Systems 
          entities={{
            buttonSwitch: { size: [boxSize/1.5, boxSize/1.5], bodyAnim: {position:{ x: boxSize/2, y: boxSize}, angle: 0}, letterAngle: 0, letter: 'P', renderer: Box, },
            physics: { engine: engine, world: world },
            floor: { body: floor, size: [width * 3 / 4, boxSize], color: "green", letter: word, text:"", renderer: Block },
          }}
        >
          <ImageBackground
          source={require('./assets/ceiling.png')} 
          style={styles.ceiling}
          />
          <StatusBar hidden={false} />
        </GameEngine>
      </ImageBackground>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
    width: '100%',
    height: '100%'
  },
  ceiling: {
    position: "absolute",
    left: 0,
    top: roundZoneHeight,
    width: width,
    height: boxSize,
    flex: 1,
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',

  }
});

