import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Share, View, Image, AppState } from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import MusicControl from 'react-native-music-control';
import opts from './config';
import * as playerStore from './libs/playerstore';

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

var idCounter = 0;

export default class WooStream extends React.Component {
    constructor(props) {
        super(props);

        this.id = idCounter++;

        this.onBuffer = this.onBuffer.bind(this);

        this.state = {
            duration: 0.0,
            currentTime: 0.0,
            volume: 1,
            muted: false,
            controls: this.props.video || false,
            paused: true,
            isBuffering: false,
            link: this.props.link,
            favoriStatus: this.props.favoriStatus || false,
            notiTtile: this.props.notiTtile || "",
            notiIkon: this.props.notiIkon || logo,
            notiAlbum: this.props.notiAlbum || "",
            notiArtist: this.props.notiArtist || "",
            notiGenre: this.props.notiGenre || "",
            notiDescription: this.props.notiDescription || "",
            notiNotificationIcon: this.props.notiNotificationIcon || "ic_launcher",
            appState: AppState.currentState,
            appStatus: true,
        }
    }

    componentDidMount = () => {
        if (opts.stopPreviousPlayers) {
            playerStore.default.addListener('id', this.controlCurrentPlayer);
        }
        AppState.addEventListener('change', this._handleAppStateChange);
    }

    componentWillUnmount = () => {
        MusicControl.stopControl();

        if (opts.stopPreviousPlayers) {
            playerStore.default.removeListener('id', this.controlCurrentPlayer);
        }
        AppState.removeEventListener('change', this._handleAppStateChange);
    }

    componentDidUpdate(prevProps) {
        var state = {};

        if (prevProps.favoriStatus != this.props.favoriStatus)
            state.favoriStatus = this.props.favoriStatus;

        if (prevProps.link != this.props.link)
            state.link = this.props.link;

        if (prevProps.notiTtile != this.props.notiTtile)
            state.notiTtile = this.props.notiTtile;

        if (prevProps.notiIkon != this.props.notiIkon)
            state.notiIkon = this.props.notiIkon;

        if (prevProps.notiAlbum != this.props.notiAlbum)
            state.notiAlbum = this.props.notiAlbum;

        if (prevProps.notiArtist != this.props.notiArtist)
            state.notiArtist = this.props.notiArtist;

        if (prevProps.notiGenre != this.props.notiGenre)
            state.notiGenre = this.props.notiGenre;

        if (prevProps.notiDescription != this.props.notiDescription)
            state.notiDescription = this.props.notiDescription;

        if (Object.keys(state).length)
            this.setState(state);
    }

    _handleAppStateChange = (nextAppState) => {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            // console.log('App has come to the foreground!');    
            this.setState({ appStatus: false });
        }
        this.setState({ appState: nextAppState, appStatus: true });

    };

    controlCurrentPlayer = () => {
        if (!this.state.paused) {
            var id = playerStore.getCurrent();
            if (this.id != id) {
                this.onPause();
            }
        }
    }

    setMusicControl = () => {
        MusicControl.setNowPlaying({
            title: this.state.notiTtile,
            artwork: this.state.notiIkon,
            artist: this.state.notiArtist,
            album: this.state.notiAlbum,
            genre: this.state.notiGenre,
            maxVolume: 1,
            volume: this.state.volume,
            description: this.state.notiDescription,
            notificationIcon: this.state.notiNotificationIcon
        });

        MusicControl.enableBackgroundMode(true);
        MusicControl.handleAudioInterruptions(true)
        MusicControl.enableControl('pause', true)
        MusicControl.enableControl('play', true)
        MusicControl.enableControl('changePlaybackPosition', true)
        MusicControl.enableControl('volume', true)
        MusicControl.enableControl('closeNotification', true, { when: 'pause' })

        MusicControl.on('play', this.onPlay);
        MusicControl.on('pause', this.onPause)
    };

    onPlay = () => {
        this.setState({ paused: false }, () => {
            this.setMusicControl();

            MusicControl.updatePlayback({
                state: MusicControl.STATE_PLAYING,
            });

            playerStore.setCurrent(this.id);
        });
    }

    onPause = () => {
        this.setState({ paused: true }, () => {
            MusicControl.updatePlayback({
                state: MusicControl.STATE_PAUSED,
            })
        });
    }

    onLoad = (data) => {
        this.setState({ duration: data.duration }, () => {
            MusicControl.updatePlayback({
                state: MusicControl.STATE_PAUSED,
                elapsedTime: Number(this.state.currentTime.toFixed()),
                duration: Number(this.state.currentTime.toFixed())
            })
        });
    }

    onProgress = (data) => {
        this.setState({ currentTime: data.currentTime }, () => {
            if (!this.state.paused)
                MusicControl.updatePlayback({
                    state: MusicControl.STATE_PLAYING,
                    elapsedTime: Number(this.state.currentTime.toFixed()),
                    duration: Number(this.state.currentTime.toFixed())
                })
        });
    }

    onBuffer = ({ isBuffering }) => {
        this.setState({ isBuffering: isBuffering });
    }

    volumeChange = (volume) => {
        this.setState({ volume }, () => {
            MusicControl.updatePlayback({
                volume: volume,
                maxVolume: 1,
            })
        })
    }

    pausedPlay = () => {
        if (this.state.paused) {
            this.onPlay();
        } else {
            this.onPause();
        }
    }

    favoriPress = () => {
        this.setState({ favoriStatus: !this.state.favoriStatus },
            () => this.props.favori && this.props.favori(this.state.favoriStatus))
    }

    shareRadio = async () => {
        try {
            const result = await Share.share({
                title: opts.title,
                message: opts.message,
                url: opts.url,
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    render() {
        return (
            <View style={{ height: 250, position: 'relative', width: '100%' }}>
                <View style={{ flex: 1 }}>
                    {
                        this.state.controls ? <>
                            <View style={styles.headerViewTop}>
                                <TouchableOpacity
                                    onPress={this.shareRadio}>
                                    <Image source={iconShare}
                                        style={[styles.headerImage, { tintColor: "#000" }]} />
                                </TouchableOpacity>
                                {
                                    this.props.favori ? <TouchableOpacity
                                        onPress={() => this.props.favori(this.state.favoriStatus)}>
                                        <Image source={this.state.favoriStatus ? opts.iconFavoriEnable : opts.iconFavoriDisable}
                                            style={[styles.headerImage, { tintColor: "#000" }]} />
                                    </TouchableOpacity> : null
                                }

                            </View>
                        </> : null
                    }

                    {this.state.appStatus ? <Video
                        source={{ uri: this.state.link }}
                        ref={(ref) => { this.player = ref }}
                        onBuffer={this.onBuffer}
                        onError={this.videoError}
                        poster={Image.resolveAssetSource(opts.backgroundImage).uri}
                        posterResizeMode={"cover"}
                        onLoad={this.onLoad}
                        paused={this.state.paused}
                        playWhenInactive={true}
                        onProgress={this.onProgress}
                        onEnd={() => { AlertIOS.alert('Done!') }}
                        audioOnly={true}
                        allowsExternalPlayback={true}
                        controls={this.state.controls}
                        muted={this.state.muted}
                        volume={this.state.volume}
                        style={styles.backgroundVideo}
                        playInBackground
                    /> : null}

                    {
                        !this.state.controls ? <>
                            <View style={styles.headerView}>
                                <TouchableOpacity
                                    onPress={this.shareRadio}>
                                    <Image source={opts.iconShare}
                                        style={styles.headerImage} />
                                </TouchableOpacity>
                                {
                                    this.props.favori ?
                                        <TouchableOpacity
                                            onPress={this.favoriPress}>
                                            <Image source={this.state.favoriStatus ? opts.iconFavoriEnable : opts.iconFavoriDisable}
                                                style={styles.headerImage} />
                                        </TouchableOpacity>
                                        : null
                                }
                            </View>
                            <View style={styles.playView}>
                                <Text style={styles.title}>{this.state.notiTtile}</Text>
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
                            </View>
                            <View style={styles.volumeControl}>
                                <TouchableOpacity onPress={() => { this.setState({ volume: 0.0 }) }}>
                                    <Image source={opts.iconVolume}
                                        style={{ width: 20, height: 40, resizeMode: "contain", paddingVertical: 5, bottom: 0 }} />
                                </TouchableOpacity>
                                <Slider
                                    style={{ width: "85%", height: 40, left: 10, alignSelf: "center", bottom: 0 }}
                                    minimumValue={0}
                                    maximumValue={1}
                                    value={0.8}
                                    onValueChange={this.volumeChange}
                                    minimumTrackTintColor="#fff"
                                    maximumTrackTintColor="#ffffff50"
                                />
                            </View>
                        </> : null
                    }

                </View>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    backgroundVideo: {
        width: "100%",
        height: 250,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    volumeControl: {
        flexDirection: "row",
        position: "absolute",
        width: "100%",
        marginHorizontal: 10,
        bottom: 10,
    },
    headerViewTop: {
        backgroundColor: "#fff",
        flexDirection: "row",
        width: "100%",
        padding: 10,
        justifyContent: "space-between"
    },
    headerView: {
        flexDirection: "row",
        position: "absolute",
        width: "100%",
        padding: 10,
        justifyContent: "space-between"
    },
    headerImage: {
        width: 25,
        height: 25,
    },
    playView: {
        flexDirection: "column",
        position: "absolute",
        top: 70,
        width: "100%",
        justifyContent: "center"
    },
    playControl: {
        flexDirection: "row",
        top: 10,
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
    title: {
        color: '#ffffff',
        alignSelf: "center",
        textShadowColor: '#00000080',
        textShadowOffset: { width: 0.5, height: 0.5 },
        fontWeight: '700',
        fontSize: 22,
        top: -20,
        textShadowRadius: 1
    }
});

