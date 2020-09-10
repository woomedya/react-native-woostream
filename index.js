import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Share, View, Image, ImageBackground, Dimensions, ActivityIndicator, Platform, Linking } from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import MusicControl from 'react-native-music-control';
import opts from './config';
import * as playerStore from './libs/playerstore';
import * as mainStore from './libs/mainstore';
import { ListItem } from 'react-native-elements';
import * as timeoutUtil from 'woo-utilities/timeout';
const { width, height } = Dimensions.get("window");

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

var streamer = null, offAvailable = false;

export const getMainState = () => {
    return mainStore.getCurrent();
}

const onPlayFromControl = () => {
    mainStore.setCurrent({
        paused: false,
    });

    setNowPlaying();
};

var configInit = false;
const musicConfig = () => {
    if (!configInit) {
        configInit = true;

        MusicControl.enableBackgroundMode(true);
        MusicControl.handleAudioInterruptions(true)
        MusicControl.enableControl('pause', true)
        MusicControl.enableControl('play', true)
        MusicControl.enableControl('changePlaybackPosition', true)
        MusicControl.enableControl('volume', true)
        MusicControl.enableControl('closeNotification', true, { when: 'never' });

        setTimeout(setNowPlaying, 1500);
    }
}

const setNowPlaying = () => {
    var mainState = mainStore.getCurrent();
    MusicControl.setNowPlaying({
        title: mainState.title,
        artwork: mainState.icon,
        artist: mainState.artist,
        album: mainState.album,
        genre: mainState.genre,
        description: mainState.description,
        notificationIcon: mainState.notificationIcon,
    });

    musicConfig();

    updatePlayback();
}

const updatePlayback = () => {
    var mainState = mainStore.getCurrent();
    musicState = mainState.paused ? MusicControl.STATE_PAUSED : MusicControl.STATE_PLAYING;
    MusicControl.updatePlayback({
        state: musicState
    });
}

const onPauseFromControl = () => {
    mainStore.setCurrent({
        paused: true
    });

    updatePlayback();
}

export default class WooStream extends React.Component {
    constructor(props) {
        super(props);

        this.id = props.description;
        var mainState = mainStore.getCurrent();

        this.link = mainState.link;
        this.volume = mainState.volume == null ? 1 : mainState.volume;

        this.state = {
            volume: this.volume,
            paused: this.id == mainState.id ? mainState.paused : true,
            muted: mainState.muted || false,
            link: this.props.link,
            favoriStatus: this.props.favoriStatus || false,
            title: this.props.title,
            icon: this.props.icon,
            description: this.props.description,

            artist: this.props.notiArtist,
            album: this.props.notiAlbum,
            genre: this.props.notiGenre,
            notificationIcon: this.props.notiNotificationIcon,

            mainState: mainState,
            mainStateId: mainState.id,
            loading: false
        }
    }

    componentDidMount = () => {
        if (opts.stopPreviousPlayers) {
            playerStore.default.addListener('id', this.controlCurrentPlayer);
        }

        mainStore.default.addListener(mainStore.STATE, this.setMainState);
    }

    componentWillUnmount = () => {
        if (opts.stopPreviousPlayers) {
            playerStore.default.removeListener('id', this.controlCurrentPlayer);
        }

        mainStore.default.removeListener(mainStore.STATE, this.setMainState);

        this.musicControlOff();
        this.musicControlOnFromOther();
    }

    musicControlOff = () => {
        if (offAvailable) {
            MusicControl.off('play', this.onPlay);
            MusicControl.off('pause', this.onPause);
        }
    }

    musicControlOn = () => {
        offAvailable = true;
        MusicControl.on('play', this.onPlay);
        MusicControl.on('pause', this.onPause);
    }

    musicControlOnFromOther = () => {
        MusicControl.on('play', onPlayFromControl);
        MusicControl.on('pause', onPauseFromControl);
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

        if (prevProps.notiArtist != this.props.notiArtist)
            state.artist = this.props.notiArtist;

        if (prevProps.notiAlbum != this.props.notiAlbum)
            state.album = this.props.notiAlbum;

        if (prevProps.notiGenre != this.props.notiGenre)
            state.genre = this.props.notiGenre;

        if (prevProps.notiNotificationIcon != this.props.notiNotificationIcon)
            state.notificationIcon = this.props.notiNotificationIcon;


        if (Object.keys(state).length) {
            state.loading = true;

            this.setState(state, () => {
                if (!this.state.paused) {
                    mainStore.setCurrent({
                        ...this.state,
                        id: this.id
                    });
                }
            });
        }
    }

    componentWillReceiveProps(prevProps) {
        var mainState = mainStore.getCurrent();
        if (mainState.id == this.id && !this.state.paused && this.link != mainState.link)
            setNowPlaying();

        this.link = mainState.link;
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
        var state = {
            mainState,
            mainStateId: mainState.id,
            paused: this.id == mainState.id ? mainState.paused : this.state.paused,
            muted: mainState.muted,
            loading: mainState.loading
        };

        if (this.volume != mainState.volume)
            state.volume = mainState.volume;

        this.setState(state);
    }

    onPlay = () => {
        this.setState({ paused: false }, () => {
            mainStore.setCurrent({
                ...this.state,
                id: this.id
            });

            playerStore.setCurrent(this.id);

            this.musicControlOff();
            setNowPlaying();
            this.musicControlOn();
        });
    }

    onPause = () => {
        this.setState({ paused: true }, () => {
            if (!this.state.paused || this.state.mainStateId == this.id) {
                mainStore.setCurrent({
                    paused: true
                });
            }

            updatePlayback();
        });
    }

    onLoad = (data) => {
        // TODO: ihtiyaç durumunda kullanılabilir
        // setNowPlaying();
    }

    onProgress = (data) => {
        if (this.state.loading) {
            this.setState({
                loading: false
            }, () => {
                mainStore.setCurrent({
                    loading: false
                });

                updatePlayback();
            });
        }
    }

    onBuffer = ({ isBuffering }) => {
        // TODO: ihtiyaç durumunda kullanılabilir
    }

    setVolume = (volume) => {
        this.volume = volume;

        mainStore.setCurrent({
            volume
        });
    }

    volumeChange = (volume) => {
        this.setVolume(volume);

        timeoutUtil.setRefreshTimeout('volume', () => {
            this.setState({ volume });
        }, 100);
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
        if (this.props.openBrowser && this.props.webUrl) {
            Linking.openURL(this.props.webUrl)
        } else if (!this.props.openBrowser) {
            if (this.state.paused) {
                this.onPlay();
            } else {
                this.onPause();
            }
        }
    }

    mainPausedPlay = () => {
        mainStore.setCurrent({
            paused: !this.state.mainState.paused
        });

        setNowPlaying();
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
                title={
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.mainRadioTitle} >
                        {this.state.mainState.title}
                    </Text>
                }
                subtitle={
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.mainRadioDescription} >
                        {this.state.mainState.description}
                    </Text>
                }
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
                            title={
                                <ActivityIndicator
                                    animating={this.state.loading && this.state.paused == false}
                                    size={this.state.loading ? (Platform.OS == 'ios' ? 50 : 20) : 0}
                                    color={'#fff'} />
                            }
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
                                        onPress={this.favoriPress}
                                        style={styles.topButtonImage}>
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
                                thumbTintColor="#fff"
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
const mainHeight = height / 4;
const styles = StyleSheet.create({
    mainContainer: { height: 50 },
    mainRadioIcon: {
        height: 40,
        width: width / 6,

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
    backgroundImage: { width: '100%', height: mainHeight, },
    topButtonContainer: { width: width, height: mainHeight / 5, paddingVertical: 0, top: 5, backgroundColor: 'transparent' },
    topButtonImage: {
        width: mainHeight / 8,
        height: mainHeight / 8,
    },
    titleContainer: { backgroundColor: 'transparent', height: mainHeight / 6, padding: 0, },
    title: {
        padding: 0,
        color: '#ffffff',
        alignSelf: "center",
        textAlign: "center",
        textShadowColor: '#00000080',
        textShadowOffset: { width: 0.5, height: 0.5 },
        fontWeight: '700',
        fontSize: mainHeight / 9,
        textShadowRadius: 1
    },
    playButtonContainer: { height: mainHeight / 2.2, backgroundColor: 'transparent', padding: 0 },
    playControl: {
        flexDirection: "row",
        alignSelf: "center",
    },
    playControlLeft: {
        width: mainHeight / 10 + 30, height: "100%", right: 10, padding: 5,
    },
    playControlCenter: {
        width: mainHeight / 3, height: "100%", alignSelf: "center",
    },
    playControlRight: {
        width: mainHeight / 10 + 30, height: "100%", left: 10, padding: 5,
    },
    playImage: {
        width: "125%", height: "100%", alignSelf: "center", padding: 0
    },
    playImagePrev: {
        width: mainHeight / 10, height: "100%", resizeMode: "contain", alignSelf: "center",
    },
    playImageNext: {
        width: mainHeight / 10, height: "100%", resizeMode: "contain", alignSelf: "center",
    },
    volumeControl: {
        flexDirection: "row",
        width: "100%",
        height: mainHeight / 6,
        backgroundColor: 'transparent',
        paddingHorizontal: 10,
        alignItems: "center",
        bottom: 0,
        padding: 0,
    },
    muteControl: { width: 20, height: 40, resizeMode: "contain", paddingVertical: 5, bottom: 0 },
    sliderControl: { width: "93%", height: 40, left: 10, alignSelf: "center", bottom: 0 }
});

