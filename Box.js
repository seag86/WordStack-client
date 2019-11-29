import React, { Component } from "react";
import { ImageBackground, View, Text, StyleSheet } from "react-native";
import { array, object, string } from 'prop-types';
import { LinearGradient } from 'expo';

export default class Box extends Component {

  static canRenderString = true;

  render() {
    const width = this.props.size[0];
    const height = this.props.size[1];
    const x = this.props.bodyAnim.position.x - width / 2;
    const y = this.props.bodyAnim.position.y - height / 2;

    const mediumColors = this.props.selected ? ['#FFF680', '#ebc960'] : ['#fff', '#d4a2f6'] //deb7f8

    return (
      <View
            style={{
            position: "absolute",
            left: x,
            top: y,
            width: width,
            height: height,
            //margin: 1,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#464fdc',
            transform: [{rotate: this.props.bodyAnim.angle  + 'rad'}],
          }}

      >
          <LinearGradient
            colors={mediumColors}
            style={{
              width: width * 1.4,
              height: height * 1.4,
              margin: 1,
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{rotate: -1 * this.props.bodyAnim.angle  + 'rad'}],
              zIndex: -1
          }}>
            <View
              style={{
                width: width-8,
                height: height-8,
                backgroundColor: "#dfdfdf",
                borderRadius: 8,
                margin: 2,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{rotate: this.props.bodyAnim.angle +'rad'}],
            }}>
              <View
                style={{
                  transform: [{rotate: this.props.letterAngle +'rad'}],
                }}
              > 
                  <Text
                    style={[
                      this.props.selected ? styles.selected : styles.normal,
                      { fontSize : height*0.42, fontWeight: 'bold' }
                    ]}
                  >
                      {this.props.letter}
                  </Text>

              </View>
            </View>
          </LinearGradient>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  normal: {
    //fontSize: 20,
    //fontWeight: 'bold',
    color: 'rebeccapurple', //'#454cd2',
    // textShadowColor: 'rgba(160, 45, 105, 1)', 
    // textShadowOffset: {width: -0.1, height: 0.1},
    // textShadowRadius: 10,
  },
    selected: {
      //fontSize: 20,
      //fontWeight: 'bold',
      color: 'navy',
      textShadowColor: 'rgba(170, 170, 0, 1)', //170, 48, 106, 1
      textShadowOffset: {width: -0.1, height: 0.1},
      textShadowRadius: 10,
    }
  })

Box.propTypes = {
  size: array,
  body: object,
  color: string
}
