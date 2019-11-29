import React, { Component } from "react";
import { View, Text } from "react-native";
import { array, object, string } from 'prop-types';

export default class Point extends Component {

  render() {

    const x = this.props.position[0]
    const y = this.props.position[1]


    return (
      <View
        style={{
            position: "absolute",
            left: x,
            top: y,
            width: 12,
            height: 12,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',   
            overflow: 'hidden',
            zIndex: -10,
          }}
      >
        
        <Text style={{fontSize: 18, color: 'white', backgroundColor: 'rgba(0, 0, 0, 0)'}}>
            {"X"}
        </Text>
      </View>
    );
  }
}

Point.propTypes = {
  position: array,
}