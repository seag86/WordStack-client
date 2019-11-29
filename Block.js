import React, { Component } from "react";
import { ImageBackground, View, Text } from "react-native";
import { array, object, string } from 'prop-types';

export default class Block extends Component {

  render() {
    const width = this.props.size[0];
    const height = this.props.size[1];
    const x = this.props.body.position.x - width / 2;
    const y = this.props.body.position.y - height / 2;

    // console.log(this.props.body)
    //backgroundColor: this.props.color || "pink",
    // borderWidth: 2,
    // borderColor: 'white',
    // transform: [{rotate: this.props.body.angle + 'rad'}],
    return (
      <View
        style={{
            position: "absolute",
            left: x,
            top: y,
            width: width,
            height: height,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            //backgroundColor: this.props.color     
          }}
      >
        <ImageBackground
          source={require('./assets/floor.png')}
          style={{
            flex: 1,
            width: width+4,
            height: height+4,
            //zIndex: 1
          }}/>
        <Text style={{color: 'white'}}>
            {this.props.letter}
        </Text>
        <Text style={{color: 'white'}}>
            {" "+this.props.text}
        </Text>
      </View>
    );
  }
}

Block.propTypes = {
  size: array,
  body: object,
  color: string
}