import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Share, View, Image, ImageBackground } from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import MusicControl from 'react-native-music-control';
import opts from './config';
import * as playerStore from './libs/playerstore';
import * as mainStore from './libs/mainstore';
import { ListItem } from 'react-native-elements';

const logo = require('./assets/logo.png');

const backgroundImageLocal = require('./assets/backgroundImage.png');
export const config = ({
    title, message, url, iconPlay, iconPause, iconPrev, iconNext, iconVolume, iconShare, iconFavoriDisable, iconFavoriEnable, backgroundImage,
    stopPreviousPlayers
}) => {
    opts.title = title || opts.title;
    opts.message = message || opts.message;
    opts.url = url || opts.url;
    opts.iconPlay = iconPlay || opts.iconPlay;
    opts.iconPause = iconPause || opts.iconPause;
    opts.iconPrev = iconPrev || opts.iconPrev;
    opts.iconNext = iconNext || opts.iconNext;
    opts.iconVolume = iconVolume || opts.iconVolume;
    opts.iconShare = iconShare || opts.iconShare;
    opts.iconFavoriDisable = iconFavoriDisable || opts.iconFavoriDisable;
    opts.iconFavoriEnable = iconFavoriEnable || opts.iconFavoriEnable;
    opts.backgroundImage = backgroundImage || backgroundImageLocal;

    if (stopPreviousPlayers != null)
        opts.stopPreviousPlayers = stopPreviousPlayers;
}

var streamer = null;

export const getMainState = () => {
    return mainStore.getCurrent();
}

export default class WooStream extends React.Component {
    constructor(props) {
        super(props);

        this.id = props.description;

        var mainState = mainStore.getCurrent();

        this.state = {
            volume: mainState.volume == null ? 1 : mainState.volume,
            paused: this.id == mainState.id ? mainState.paused : true,
            mute: mainState.muted || false,
            link: this.props.link,
            favoriStatus: this.props.favoriStatus || false,
            title: this.props.title,
            icon: this.props.icon,
            description: this.props.description,
            mainState: mainState,
            mainStateId: mainState.id
        }
    }

    componentDidMount = () => {
        if (opts.stopPreviousPlayers) {
            playerStore.default.addListener('id', this.controlCurrentPlayer);
        }

        mainStore.default.addListener(mainStore.STATE, this.setMainState);
    }

    componentWillUnmount = () => {
        MusicControl.stopControl();

        if (opts.stopPreviousPlayers) {
            playerStore.default.removeListener('id', this.controlCurrentPlayer);
        }

        mainStore.default.removeListener(mainStore.STATE, this.setMainState);

        MusicControl.off('play', this.onPlay);
        MusicControl.off('pause', this.onPause);
    }

    componentDidUpdate(prevProps) {
        var state = {};

        if (prevProps.favoriStatus != this.props.favoriStatus)
            state.favoriStatus = this.props.favoriStatus;

        if (prevProps.link != this.props.link)
            state.link = this.props.link;

        if (prevProps.title != this.props.title)
            state.title = this.props.title;

        if (prevProps.icon != this.props.icon)
            state.icon = this.props.icon;

        if (prevProps.description != this.props.description)
            state.description = this.props.description;

        if (Object.keys(state).length)
            this.setState(state, () => {
                if (!this.state.paused) {
                    mainStore.setCurrent({
                        ...this.state,
                        id: this.id
                    });
                }

                this.setMusicControl();
            });
    }

    controlCurrentPlayer = () => {
        if (!this.state.paused) {
            var id = playerStore.getCurrent();
            if (this.id != id) {
                this.onPause();
            }
        }
    }

    setMainState = () => {
        var mainState = mainStore.getCurrent();
        this.setState({
            mainState,
            mainStateId: mainState.id,
            paused: this.id == mainState.id ? mainState.paused : this.state.paused,
            muted: mainState.muted,
            volume: mainState.volume
        });
    }

    setMusicControl = () => {
        MusicControl.setNowPlaying({
            title: this.props.notiTtile || "",
            artwork: this.props.notiIkon || logo,
            artist: this.props.notiArtist || "",
            album: this.props.notiAlbum || "",
            genre: this.props.notiGenre || "",
            description: this.props.notiDescription || "",
            notificationIcon: this.props.notiNotificationIcon || "ic_launcher",
            maxVolume: 1,
            volume: this.props.volume,
        });

        MusicControl.enableBackgroundMode(true);
        MusicControl.handleAudioInterruptions(true)
        MusicControl.enableControl('pause', true)
        MusicControl.enableControl('play', true)
        MusicControl.enableControl('changePlaybackPosition', true)
        MusicControl.enableControl('volume', true)
        MusicControl.enableControl('closeNotification', true, { when: 'pause' });

        MusicControl.off('play', this.onPlay);
        MusicControl.off('pause', this.onPause)

        MusicControl.on('play', this.onPlay);
        MusicControl.on('pause', this.onPause)
    };

    onPlay = () => {
        this.setState({ paused: false }, () => {
            mainStore.setCurrent({
                ...this.state,
                id: this.id
            });

            this.setMusicControl();

            MusicControl.updatePlayback({
                state: MusicControl.STATE_PLAYING,
            });

            playerStore.setCurrent(this.id);
        });
    }

    onPause = () => {
        this.setState({ paused: true }, () => {
            if (!this.state.paused || this.state.mainStateId == this.id) {
                mainStore.setCurrent({
                    paused: true
                });
            }

            MusicControl.updatePlayback({
                state: MusicControl.STATE_PAUSED,
            })
        });
    }

    onLoad = (data) => {
        MusicControl.updatePlayback({
            state: MusicControl.STATE_PAUSED,
            elapsedTime: Number(data.duration.toFixed()),
            duration: Number(data.duration.toFixed())
        })
    }

    onProgress = (data) => {
        MusicControl.updatePlayback({
            state: MusicControl.STATE_PLAYING,
            elapsedTime: Number(data.currentTime.toFixed()),
            duration: Number(data.currentTime.toFixed())
        })
    }

    onBuffer = ({ isBuffering }) => {
        // TODO: ihtiyaç durumunda kullanılabilir
    }

    volumeChange = (volume) => {
        this.setState({ volume }, () => {
            mainStore.setCurrent({
                volume
            });

            MusicControl.updatePlayback({
                volume: volume,
                maxVolume: 1,
            })
        })
    }

    muteToggle = () => {
        var muted = !this.state.muted;
        this.setState({
            muted
        }, () => {
            mainStore.setCurrent({
                muted
            });
        });
    }

    pausedPlay = () => {
        if (this.state.paused) {
            this.onPlay();
        } else {
            this.onPause();
        }
    }

    mainPausedPlay = () => {
        mainStore.setCurrent({
            paused: !this.state.mainState.paused
        });
    }

    favoriPress = () => {
        this.setState({
            favoriStatus: !this.state.favoriStatus
        }, () => {
            if (this.props.favori) this.props.favori(this.state.favoriStatus);
        })
    }

    shareRadio = async () => {
        try {
            await Share.share({
                title: opts.title,
                message: opts.message,
                url: opts.url,
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    renderMain = () => {
        return this.state.mainStateId && this.state.mainStateId != this.id ? <>
            <ListItem
                containerStyle={styles.mainContainer}
                leftElement={
                    <Image
                        source={{ uri: this.state.mainState.icon }}
                        style={styles.mainRadioIcon}
                        resizeMode="contain"
                    />
                }
                title={this.state.mainState.title}
                titleStyle={styles.mainRadioTitle}
                subtitle={this.state.mainState.description}
                subtitleStyle={styles.mainRadioDescription}
                rightElement={
                    <TouchableOpacity onPress={this.mainPausedPlay}>
                        <Image
                            source={this.state.mainState.paused ? opts.iconPlay : opts.iconPause}
                            style={styles.mainPlayIcon} />
                    </TouchableOpacity>
                }
            />
        </> : null;
    }

    renderStreamer = () => {
        var state = !this.state.mainStateId || this.id == this.state.mainStateId ? this.state : this.state.mainState;

        if (streamer == null)
            streamer = this.id;

        return streamer == this.id ? <Video
            source={{ uri: state.link }}
            ref={(ref) => { this.player = ref }}
            onBuffer={this.onBuffer}
            onError={this.videoError}
            posterResizeMode={"cover"}
            onLoad={this.onLoad}
            paused={state.paused}
            playWhenInactive={true}
            onProgress={this.onProgress}
            audioOnly={true}
            allowsExternalPlayback={true}
            controls={false}
            muted={state.muted}
            volume={state.volume}
            playInBackground
        /> : null;
    }

    render() {
        return (
            <View>
                {this.renderMain()}

                <View>
                    <ImageBackground source={opts.backgroundImage} style={styles.backgroundImage}>

                        <ListItem
                            containerStyle={styles.topButtonContainer}
                            leftElement={
                                <TouchableOpacity
                                    onPress={this.shareRadio}>
                                    <Image source={opts.iconShare}
                                        style={styles.topButtonImage} />
                                </TouchableOpacity>
                            }
                            rightElement={
                                this.props.favori ?
                                    <TouchableOpacity
                                        onPress={this.favoriPress}>
                                        <Image source={this.state.favoriStatus ? opts.iconFavoriEnable : opts.iconFavoriDisable}
                                            style={styles.topButtonImage} />
                                    </TouchableOpacity>
                                    : null
                            }
                        />

                        <ListItem
                            containerStyle={styles.titleContainer}
                            title={this.state.title}
                            titleStyle={styles.title}
                        />

                        <ListItem
                            containerStyle={styles.playButtonContainer}
                            title={
                                <View style={styles.playControl}>
                                    <TouchableOpacity style={styles.playControlLeft}
                                        onPress={this.props.prev}>
                                        <Image source={opts.iconPrev}
                                            style={styles.playImagePrev} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.playControlCenter}
                                        onPress={this.pausedPlay}>
                                        <Image
                                            source={this.state.paused ? opts.iconPlay : opts.iconPause}
                                            style={styles.playImage} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.playControlRight}
                                        onPress={this.props.next}>
                                        <Image source={opts.iconNext}
                                            style={styles.playImageNext} />
                                    </TouchableOpacity>
                                </View>
                            }
                        />

                        <View style={styles.volumeControl}>
                            <TouchableOpacity onPress={this.muteToggle}>
                                <Image source={this.state.muted ? opts.iconMute : opts.iconVolume}
                                    style={styles.muteControl} />
                            </TouchableOpacity>
                            <Slider
                                style={styles.sliderControl}
                                minimumValue={0}
                                maximumValue={1}
                                value={this.state.volume}
                                onValueChange={this.volumeChange}
                                minimumTrackTintColor="#fff"
                                maximumTrackTintColor="#ffffff50"
                            />
                        </View>

                        {this.renderStreamer()}

                    </ImageBackground>
                </View>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    mainContainer: { height: 50 },
    mainRadioIcon: {
        height: 40,
        width: 60,

    },
    mainRadioTitle: {
        color: '#2c3e50',
        fontSize: 14
    },
    mainRadioDescription: {
        color: '#95a5a6',
        fontSize: 12
    },
    mainPlayIcon: {
        height: 40,
        width: 40,
        alignContent: 'flex-end',
    },
    backgroundImage: { width: '100%' },
    topButtonContainer: { height: 50, backgroundColor: 'transparent' },
    topButtonImage: {
        width: 25,
        height: 25,
    },
    titleContainer: { height: 50, backgroundColor: 'transparent' },
    title: {
        color: '#ffffff',
        alignSelf: "center",
        textShadowColor: '#00000080',
        textShadowOffset: { width: 0.5, height: 0.5 },
        fontWeight: '700',
        fontSize: 22,
        textShadowRadius: 1
    },
    playButtonContainer: { height: 100, backgroundColor: 'transparent' },
    playControl: {
        flexDirection: "row",
        alignSelf: "center",
    },
    playControlLeft: {
        width: 40, height: 40, right: 10,
    },
    playControlCenter: {
        width: 80, height: 80, alignSelf: "center",
    },
    playControlRight: {
        width: 40, height: 40, left: 10,
    },
    playImage: {
        width: 80, height: 80, alignSelf: "center",
    },
    playImagePrev: {
        width: 20, height: 80, right: 15, resizeMode: "contain", alignSelf: "center",
    },
    playImageNext: {
        width: 20, height: 80, left: 15, resizeMode: "contain", alignSelf: "center",
    },
    volumeControl: {
        flexDirection: "row",
        width: "100%",
        marginHorizontal: 10,
        bottom: 10,
    },
    muteControl: { width: 20, height: 40, resizeMode: "contain", paddingVertical: 5, bottom: 0 },
    sliderControl: { width: "85%", height: 40, left: 10, alignSelf: "center", bottom: 0 }
});

