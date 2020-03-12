

import { Image, } from 'react-native';
export default opts = {
    title: 'Woo Medya Share',
    message: 'Woo Medya Yazılım Şirketi',
    url: 'http://www.woomedya.com.tr',
    iconPlay: require('./assets/iconPlay.png'),
    iconPause: require('./assets/iconPause.png'),
    iconPrev: require('./assets/iconPrev.png'),
    iconNext: require('./assets/iconNext.png'),
    iconVolume: require('./assets/iconVolume.png'),
    iconShare: require('./assets/iconShare.png'),
    iconFavoriDisable: require('./assets/iconFavoriDisable.png'),
    iconFavoriEnable: require('./assets/iconFavoriEnable.png'),
    backgroundImage: Image.resolveAssetSource(require('./assets/backgroundImage.png')).uri,
};