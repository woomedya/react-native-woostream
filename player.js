import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ListItem, Image } from 'react-native-elements';
const iconPlay = require("./assets/iconPlay.png");
const iconPause = require("./assets/iconPause.png")
export default class player extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            paused: true,
        }
    }

    componentDidMount = () => {

    }

    componentWillUnmount = () => {

    }


    onPlay = () => {
        this.setState({ paused: false });
    }

    onPause = () => {
        this.setState({ paused: true });

    }

    pausedPlay = () => {
        if (this.state.paused) {
            this.onPlay();
        } else {
            this.onPause();
        }
    }


    render() {
        return (
            <View style={[styles.cards, { height: 100, position: 'relative', width: '100%' }]}>
                <ListItem
                    leftElement={<TouchableOpacity>
                        <Image
                            source={{ uri: "http://www.ostimradyo.com/themes/ostim/images/logo.png" }}
                            style={{ width: 70, height: 40 }}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>}

                    title={"Ostim Radyo"}
                    subtitle={"Nazan'la Nazlı Ezgiler"}
                    rightElement={<TouchableOpacity onPress={this.pausedPlay}>
                        <Image
                            source={this.state.paused ? iconPlay : iconPause}
                            style={styles.playicon}

                        />
                    </TouchableOpacity>}

                />
            </View>
        );
    }
};

const styles = StyleSheet.create({
    cards: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,

        elevation: 6,
    },
    playicon: {

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
        width: 50, height: 50
    }
});

